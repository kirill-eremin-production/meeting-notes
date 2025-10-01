import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { FileTranscriptionRepository } from './file-transcription.repository';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `audio-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'audio/mpeg',
          'audio/mp4',
          'audio/x-m4a',
          'audio/wav',
          'audio/webm',
          'video/mp4',
          'video/webm',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Недопустимый формат файла. Разрешены только аудио и видео файлы.'), false);
        }
      },
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    {
      provide: 'TRANSCRIPTION_REPOSITORY',
      useClass: FileTranscriptionRepository,
    },
  ],
})
export class TranscriptionModule {}