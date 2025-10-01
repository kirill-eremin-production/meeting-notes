import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class TranscriptionService {
  async transcribe(filePath: string, originalName: string): Promise<{
    transcript: string;
    filename: string;
    duration?: number;
  }> {
    console.log(`🎬 Начинаю транскрибацию: ${originalName}`);

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

    // Запускаем транскрибацию
    await this.runPythonScript(pythonScriptPath, filePath, outputPath);

    // Читаем результат
    const transcript = await fs.readFile(outputPath, 'utf-8');

    // Удаляем временные файлы
    try {
      await fs.unlink(filePath);
      await fs.unlink(outputPath);
    } catch (error) {
      console.warn('Не удалось удалить временные файлы:', error);
    }

    console.log(`✅ Транскрибация завершена: ${originalName}`);

    return {
      transcript,
      filename: originalName,
    };
  }

  private runPythonScript(
    scriptPath: string,
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath, inputPath, outputPath]);

      let stderr = '';

      python.stdout.on('data', (data) => {
        console.log(data.toString());
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