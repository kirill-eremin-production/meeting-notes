import { TranscriptionResult } from './transcription.types';

/**
 * Интерфейс репозитория для работы с транскрибациями
 * Абстракция позволит легко заменить хранилище (файлы -> БД)
 */
export interface TranscriptionRepository {
  /**
   * Сохранить транскрибацию
   */
  save(transcription: TranscriptionResult): Promise<void>;

  /**
   * Найти транскрибацию по ID
   */
  findById(id: string): Promise<TranscriptionResult | null>;

  /**
   * Получить все транскрибации
   */
  findAll(): Promise<TranscriptionResult[]>;

  /**
   * Удалить транскрибацию
   */
  delete(id: string): Promise<void>;
}