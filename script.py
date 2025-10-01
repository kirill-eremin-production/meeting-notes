#!/usr/bin/env python3
"""
Скрипт транскрибации аудио/видео файлов с помощью Whisper
"""

import sys
import whisper
from pathlib import Path


def transcribe_file(input_file: str, output_file: str, model_size: str = "small"):
    """
    Транскрибирует аудио/видео файл с помощью Whisper
    
    Args:
        input_file: Путь к входному файлу
        output_file: Путь к выходному текстовому файлу
        model_size: Размер модели Whisper (tiny, base, small, medium, large)
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Входной файл не найден: {input_file}")
    
    print(f"📁 Входной файл: {input_path.name}")
    print(f"📝 Выходной файл: {output_file}")
    print(f"🤖 Модель: {model_size}")
    print()
    
    # Загружаем модель Whisper
    print("⏳ Загружаю модель Whisper...")
    model = whisper.load_model(model_size)
    print("✅ Модель загружена")
    print()
    
    # Транскрибируем файл
    print("🎙️  Начинаю транскрибацию...")
    result = model.transcribe(str(input_path))
    
    # Извлекаем текст и метаданные
    text = result.get("text", "").strip()
    language = result.get("language", "unknown")
    
    if not text:
        raise ValueError("Не удалось получить текст из файла")
    
    # Сохраняем результат
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(text, encoding="utf-8")
    
    print(f"✅ Транскрибация завершена!")
    print(f"📊 Статистика:")
    print(f"   - Язык: {language}")
    print(f"   - Символов: {len(text)}")
    print(f"   - Файл сохранён: {output_path.absolute()}")


def main():
    """Точка входа скрипта"""
    if len(sys.argv) < 3:
        print("❌ Недостаточно аргументов")
        print()
        print("Использование:")
        print("  python3 script.py <входной_файл> <выходной_файл> [размер_модели]")
        print()
        print("Примеры:")
        print("  python3 script.py rec.m4a transcript.txt")
        print("  python3 script.py video.mp4 output.txt medium")
        print()
        print("Размеры модели: tiny, base, small, medium, large")
        print("По умолчанию: medium")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    model_size = sys.argv[3] if len(sys.argv) > 3 else "small"
    
    try:
        transcribe_file(input_file, output_file, model_size)
    except Exception as error:
        print(f"\n❌ Ошибка: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()