export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error';

export type TranscriptionResult = {
  id: string;
  status: TranscriptionStatus;
  filename: string;
  transcript?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  progress?: number; // Прогресс в процентах (0-100)
  currentText?: string; // Текущий распознанный текст
};