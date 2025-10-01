import { Module } from '@nestjs/common';
import { TranscriptionModule } from './transcription/transcription.module';

@Module({
  imports: [TranscriptionModule],
})
export class AppModule {}