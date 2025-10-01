import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptionService } from './transcription.service';
import { Response } from 'express';
import { join } from 'path';

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
      
      // Создаем новую транскрибацию и получаем ID
      const transcriptionId = await this.transcriptionService.createTranscription(
        file.originalname,
      );

      // Запускаем транскрибацию асинхронно
      await this.transcriptionService.startTranscription(
        transcriptionId,
        file.path,
        file.originalname,
      );

      return {
        success: true,
        message: 'Транскрибация запущена',
        transcriptionId,
        url: `/transcription/${transcriptionId}`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Ошибка запуска транскрибации',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/status')
  async getTranscriptionStatus(@Param('id') id: string) {
    console.log(`🔍 Запрос статуса транскрибации: ${id}`);
    
    const transcription = await this.transcriptionService.getTranscription(id);

    console.log(`📊 Получены данные транскрибации:`, transcription);

    if (!transcription) {
      console.warn(`⚠️ Транскрибация не найдена: ${id}`);
      throw new HttpException(
        {
          success: false,
          message: 'Транскрибация не найдена',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      data: transcription,
    };
  }

  @Get(':id')
  async getTranscriptionPage(
    @Param('id') _id: string,
    @Res() res: Response,
  ) {
    // Возвращаем HTML страницу для просмотра статуса
    const htmlPath = join(process.cwd(), 'public', 'transcription.html');
    return res.sendFile(htmlPath);
  }
}