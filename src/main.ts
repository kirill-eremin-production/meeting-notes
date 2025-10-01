import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Настройка CORS
  app.enableCors();
  
  // Статические файлы
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
  console.log(`📄 Открыть форму: http://localhost:${port}`);
}

bootstrap();