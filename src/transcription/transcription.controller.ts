import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptionService } from './transcription.service';

@Controller('transcription')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Get('status')
  getStatus() {
    return {
      status: 'ok',
      message: 'Сервис транскрибации работает',
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException(
        'Файл не загружен',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(`📁 Получен файл: ${file.originalname} (${file.size} bytes)`);
      
      const result = await this.transcriptionService.transcribe(
        file.path,
        file.originalname,
      );

      return {
        success: true,
        message: 'Транскрибация завершена',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Ошибка транскрибации',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}