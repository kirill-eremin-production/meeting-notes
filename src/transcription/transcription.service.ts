import { Injectable, Inject } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TranscriptionRepository } from './transcription.repository';
import { TranscriptionResult } from './transcription.types';

@Injectable()
export class TranscriptionService {
  constructor(
    @Inject('TRANSCRIPTION_REPOSITORY')
    private readonly repository: TranscriptionRepository,
  ) {}

  async createTranscription(filename: string): Promise<string> {
    const transcriptionId = uuidv4();
    const transcription: TranscriptionResult = {
      id: transcriptionId,
      status: 'pending',
      filename,
      createdAt: new Date(),
      progress: 0,
    };

    await this.repository.save(transcription);
    return transcriptionId;
  }

  async getTranscription(transcriptionId: string): Promise<TranscriptionResult | null> {
    return this.repository.findById(transcriptionId);
  }

  async startTranscription(
    transcriptionId: string,
    filePath: string,
    originalName: string,
  ): Promise<void> {
    const transcription = await this.repository.findById(transcriptionId);
    if (!transcription) {
      throw new Error('Транскрибация не найдена');
    }

    transcription.status = 'processing';
    transcription.progress = 0;
    await this.repository.save(transcription);

    // Запускаем транскрибацию асинхронно
    this.transcribe(transcriptionId, filePath, originalName).catch((error) => {
      console.error('Ошибка транскрибации:', error);
    });
  }

  private async transcribe(
    transcriptionId: string,
    filePath: string,
    originalName: string,
  ): Promise<void> {
    const transcription = await this.repository.findById(transcriptionId);
    if (!transcription) {
      return;
    }

    try {
      console.log(`🎬 Начинаю транскрибацию ${transcriptionId}: ${originalName}`);

      // Путь к выходному файлу
      const outputPath = filePath.replace(/\.[^/.]+$/, '.txt');

      // Путь к Python скрипту (в корне проекта)
      const pythonScriptPath = join(process.cwd(), 'script.py');

      // Проверяем существование Python скрипта
      try {
        await fs.access(pythonScriptPath);
      } catch (error) {
        throw new Error(`Python скрипт не найден: ${pythonScriptPath}`);
      }

      // Запускаем транскрибацию с обработкой прогресса
      await this.runPythonScript(
        transcriptionId,
        pythonScriptPath,
        filePath,
        outputPath,
      );

      // Читаем финальный результат
      const transcript = await fs.readFile(outputPath, 'utf-8');

      // Удаляем временные файлы
      try {
        await fs.unlink(filePath);
        await fs.unlink(outputPath);
      } catch (error) {
        console.warn('Не удалось удалить временные файлы:', error);
      }

      console.log(`✅ Транскрибация завершена ${transcriptionId}: ${originalName}`);

      // Обновляем финальный статус
      const finalTranscription = await this.repository.findById(transcriptionId);
      if (finalTranscription) {
        finalTranscription.status = 'completed';
        finalTranscription.transcript = transcript;
        finalTranscription.completedAt = new Date();
        finalTranscription.progress = 100;
        await this.repository.save(finalTranscription);
      }
    } catch (error) {
      console.error(`❌ Ошибка транскрибации ${transcriptionId}:`, error);
      
      // Обновляем статус с ошибкой
      const errorTranscription = await this.repository.findById(transcriptionId);
      if (errorTranscription) {
        errorTranscription.status = 'error';
        errorTranscription.error = error.message;
        errorTranscription.completedAt = new Date();
        await this.repository.save(errorTranscription);
      }
    }
  }

  private async updateProgress(
    transcriptionId: string,
    progress: number,
    currentText?: string,
  ): Promise<void> {
    const transcription = await this.repository.findById(transcriptionId);
    if (transcription) {
      transcription.progress = progress;
      if (currentText) {
        transcription.currentText = currentText;
      }
      await this.repository.save(transcription);
    }
  }

  private runPythonScript(
    transcriptionId: string,
    scriptPath: string,
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Используем Python из виртуального окружения если оно существует
      const venvPython = join(process.cwd(), 'venv', 'bin', 'python');
      const pythonCommand = require('fs').existsSync(venvPython) ? venvPython : 'python3';
      
      const python = spawn(pythonCommand, [scriptPath, inputPath, outputPath]);

      let stderr = '';
      let stdoutBuffer = '';

      python.stdout.on('data', async (data) => {
        const output = data.toString();
        stdoutBuffer += output;

        // Обрабатываем построчно для JSON
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || ''; // Сохраняем неполную строку

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonData = JSON.parse(line);
              
              if (jsonData.type === 'progress') {
                // Обновляем прогресс в реальном времени
                await this.updateProgress(
                  transcriptionId,
                  jsonData.progress,
                  jsonData.currentText,
                );
                console.log(`📊 Прогресс ${transcriptionId}: ${jsonData.progress}%`);
              } else if (jsonData.type === 'complete') {
                console.log(`✅ Транскрибация завершена: ${jsonData.length} символов`);
              }
            } catch (error) {
              // Не JSON строка, выводим как обычный лог
              console.log(line);
            }
          }
        }
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(data.toString());
      });

      python.on('error', (error) => {
        reject(new Error(`Ошибка запуска Python: ${error.message}`));
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Python процесс завершился с ошибкой (код ${code}):\n${stderr}`,
            ),
          );
        }
      });
    });
  }
}