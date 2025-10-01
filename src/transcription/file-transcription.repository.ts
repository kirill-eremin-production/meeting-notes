import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TranscriptionRepository } from './transcription.repository';
import { TranscriptionResult } from './transcription.types';

/**
 * Реализация репозитория с хранением в файловой системе
 * Каждая транскрибация сохраняется в отдельный JSON файл
 */
@Injectable()
export class FileTranscriptionRepository
  implements TranscriptionRepository, OnModuleInit
{
  private readonly storageDir: string;

  constructor() {
    this.storageDir = join(process.cwd(), 'data', 'transcriptions');
  }

  async onModuleInit() {
    // Создаем директорию при инициализации модуля
    await this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Ошибка создания директории для транскрибаций:', error);
    }
  }

  private getFilePath(id: string): string {
    return join(this.storageDir, `${id}.json`);
  }

  async save(transcription: TranscriptionResult): Promise<void> {
    const filePath = this.getFilePath(transcription.id);
    
    // Явно формируем объект для сохранения
    const data = {
      id: transcription.id,
      status: transcription.status,
      filename: transcription.filename,
      createdAt: transcription.createdAt.toISOString(),
      completedAt: transcription.completedAt?.toISOString() || null,
      transcript: transcription.transcript || null,
      error: transcription.error || null,
      progress: transcription.progress !== undefined ? transcription.progress : null,
      currentText: transcription.currentText || null,
    };

    console.log(`💾 Сохраняю транскрибацию ${transcription.id}:`, data);

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<TranscriptionResult | null> {
    try {
      const filePath = this.getFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      console.log(`📖 Читаю транскрибацию ${id}:`, data);

      // Преобразуем строки обратно в даты и сохраняем все поля
      const result: TranscriptionResult = {
        id: data.id,
        status: data.status,
        filename: data.filename,
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        transcript: data.transcript,
        error: data.error,
        progress: data.progress,
        currentText: data.currentText,
      };

      return result;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️ Файл транскрибации не найден: ${id}`);
        return null;
      }
      console.error(`❌ Ошибка чтения транскрибации ${id}:`, error);
      throw error;
    }
  }

  async findAll(): Promise<TranscriptionResult[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      const transcriptions = await Promise.all(
        jsonFiles.map(async (file) => {
          const id = file.replace('.json', '');
          return this.findById(id);
        }),
      );

      return transcriptions.filter(
        (t): t is TranscriptionResult => t !== null,
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filePath = this.getFilePath(id);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}