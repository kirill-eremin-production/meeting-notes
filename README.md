# 🎤 Сервис транскрибации аудио/видео

Веб-сервер на NestJS для автоматической транскрибации аудио и видео файлов с использованием OpenAI Whisper.

## ✨ Возможности

- 📤 Загрузка аудио/видео файлов через веб-интерфейс
- 🎯 Автоматическая транскрибация с помощью Whisper AI
- 🌐 REST API для интеграции
- 📱 Адаптивный веб-интерфейс
- 🔄 Поддержка Drag & Drop

## 📋 Требования

- Node.js 16+ 
- Python 3.7+
- pip3

## 🚀 Установка

1. **Установите зависимости Node.js:**
```bash
npm install
```

2. **Установите зависимости Python:**
```bash
pip3 install openai-whisper tqdm
```

## 🎯 Запуск

### Режим разработки (с автоперезагрузкой):
```bash
npm run start:dev
```

### Обычный режим:
```bash
npm run start
```

### Production режим:
```bash
npm run build
npm run start:prod
```

Сервер будет доступен по адресу: `http://localhost:3000`

## 📖 API Endpoints

### `POST /transcription/upload`

Загрузка и транскрибация аудио/видео файла.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `audio` (file)

**Response:**
```json
{
  "success": true,
  "message": "Транскрибация завершена",
  "data": {
    "transcript": "текст транскрибации...",
    "filename": "original-filename.mp4"
  }
}
```

### `GET /transcription/status`

Проверка статуса сервиса.

**Response:**
```json
{
  "status": "ok",
  "message": "Сервис транскрибации работает"
}
```

## 🎨 Веб-интерфейс

Откройте в браузере: `http://localhost:3000`

Интерфейс позволяет:
- Загружать файлы через кнопку или перетаскиванием
- Отслеживать прогресс обработки
- Просматривать результаты транскрибации

## 📁 Поддерживаемые форматы

- **Аудио:** MP3, M4A, WAV, WebM
- **Видео:** MP4, WebM
- **Максимальный размер:** 500 MB

## 🛠️ Структура проекта

```
.
├── src/
│   ├── main.ts                    # Точка входа приложения
│   ├── app.module.ts              # Корневой модуль
│   └── transcription/
│       ├── transcription.module.ts      # Модуль транскрибации
│       ├── transcription.controller.ts  # Контроллер API
│       └── transcription.service.ts     # Сервис обработки
├── public/
│   └── index.html                 # Веб-интерфейс
├── script.py                      # Python скрипт Whisper
├── package.json                   # Зависимости Node.js
└── tsconfig.json                  # Конфигурация TypeScript
```

## 🔧 Конфигурация

### Порт сервера

По умолчанию: `3000`. Изменить можно через переменную окружения:

```bash
PORT=8080 npm run start:dev
```

### Папка для загрузок

По умолчанию: `./uploads` (создается автоматически)

## 📝 Примеры использования

### cURL

```bash
curl -X POST http://localhost:3000/transcription/upload \
  -F "audio=@video.mp4"
```

### JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('audio', fileInput.files[0]);

const response = await fetch('http://localhost:3000/transcription/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.transcript);
```

## ⚠️ Важные замечания

- Первая транскрибация может занять больше времени (загрузка модели Whisper)
- Время обработки зависит от длительности файла и мощности системы
- Убедитесь, что установлены все Python зависимости

## 🐛 Устранение проблем

### Python не найден
```bash
# Проверьте установку Python
python3 --version

# Установите Python с официального сайта
# https://www.python.org/downloads/
```

### Ошибка установки Whisper
```bash
# Попробуйте установить с --upgrade
pip3 install --upgrade openai-whisper

# Или используйте conda
conda install -c conda-forge openai-whisper
```

### Ошибки TypeScript
```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

## 📄 Лицензия

ISC