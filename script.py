#!/usr/bin/env python3
"""
Скрипт транскрибации аудио/видео файлов с помощью Whisper
С поддержкой прогресса в реальном времени
"""

import sys
import json
import whisper
from pathlib import Path
from tqdm import tqdm as original_tqdm

# Импортируем модуль whisper.transcribe для патчинга
try:
    import whisper.transcribe as whisper_transcribe_module
    HAS_WHISPER_TRANSCRIBE = True
except (ImportError, AttributeError):
    HAS_WHISPER_TRANSCRIBE = False


# Глобальная переменная для отслеживания текущего прогресса
current_progress_data = {
    "progress": 0,
    "current_text": "",
    "accumulated_segments": []
}


def print_progress(progress_percent: int, current_text: str = ""):
    """
    Выводит прогресс в JSON формате для парсинга Node.js
    
    Args:
        progress_percent: Прогресс в процентах (0-100)
        current_text: Текущий распознанный текст
    """
    current_progress_data["progress"] = progress_percent
    current_progress_data["current_text"] = current_text
    
    progress_data = {
        "type": "progress",
        "progress": progress_percent,
        "currentText": current_text
    }
    print(json.dumps(progress_data), flush=True)


class TqdmProgress(original_tqdm):
    """
    Кастомный класс tqdm для перехвата прогресса Whisper
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._last_reported_progress = 0
    
    def update(self, n=1):
        """Переопределяем update для отправки прогресса"""
        result = super().update(n)
        
        if self.total and self.total > 0:
            # Рассчитываем прогресс (30% уже использовано для загрузки, 70% для транскрибации)
            whisper_progress = (self.n / self.total) * 100
            overall_progress = 30 + int(whisper_progress * 0.60)
            
            # Отправляем обновление только если прогресс изменился минимум на 1%
            if overall_progress - self._last_reported_progress >= 1:
                # Берем накопленный текст из сегментов
                accumulated_text = " ".join(current_progress_data["accumulated_segments"])
                if not accumulated_text:
                    accumulated_text = f"Транскрибация: {int(whisper_progress)}%"
                
                print_progress(
                    overall_progress,
                    accumulated_text
                )
                self._last_reported_progress = overall_progress
        
        return result
    
    def close(self):
        """Переопределяем close для финального обновления после tqdm"""
        # Отправляем финальный прогресс только если еще не отправили 90%
        if self._last_reported_progress < 90:
            accumulated_text = " ".join(current_progress_data["accumulated_segments"])
            if not accumulated_text:
                accumulated_text = "Завершение транскрибации..."
            
            print_progress(90, accumulated_text)
            self._last_reported_progress = 90
        
        result = super().close()
        return result


def transcribe_file(input_file: str, output_file: str, model_size: str = "large"):
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
    
    print_progress(0, "Инициализация...")
    
    # Загружаем модель Whisper
    print_progress(10, "Загрузка модели Whisper...")
    model = whisper.load_model(model_size)
    print_progress(20, "Модель загружена")
    
    # Транскрибируем файл с отслеживанием прогресса
    print_progress(30, "Начинаю транскрибацию...")
    
    # Сбрасываем накопленные сегменты
    current_progress_data["accumulated_segments"] = []
    
    # Многоуровневый monkey-patch для надежного перехвата прогресса
    patches = []
    
    # 1. Патчим sys.modules['tqdm']
    if 'tqdm' in sys.modules:
        original_sys_tqdm = sys.modules['tqdm'].tqdm
        sys.modules['tqdm'].tqdm = TqdmProgress
        patches.append(('sys_modules', original_sys_tqdm))
    
    # 2. Патчим whisper.transcribe.tqdm напрямую
    if HAS_WHISPER_TRANSCRIBE and hasattr(whisper_transcribe_module, 'tqdm'):
        original_whisper_tqdm = whisper_transcribe_module.tqdm
        whisper_transcribe_module.tqdm = TqdmProgress
        patches.append(('whisper_transcribe', original_whisper_tqdm))
    
    # 3. Патчим вывод для перехвата сегментов (упрощенная версия)
    # Используем callback через итерацию по сегментам в результате
    # вместо сложного перехвата stdout
    
    try:
        # Используем verbose=False чтобы не мешать нашему прогрессу
        result = model.transcribe(
            str(input_path),
            verbose=False,
            language='ru'
        )
    finally:
        # Восстанавливаем все патчи в обратном порядке
        for patch_type, original_value in reversed(patches):
            if patch_type == 'sys_modules':
                sys.modules['tqdm'].tqdm = original_value
            elif patch_type == 'whisper_transcribe':
                whisper_transcribe_module.tqdm = original_value
    
    # СТРАХОВКА: Гарантируем что достигли 90% после транскрибации
    if current_progress_data["progress"] < 90:
        print_progress(90, "Завершение транскрибации...")
    
    # Извлекаем финальный текст и метаданные
    text = result.get("text", "").strip()
    language = result.get("language", "unknown")
    segments = result.get("segments", [])
    
    if not text:
        raise ValueError("Не удалось получить текст из файла")
    
    # Показываем превью из сегментов
    if segments:
        # Берем текст из первых сегментов для показа прогресса
        preview_segments = segments[:min(3, len(segments))]
        preview_text = " ".join(seg.get("text", "").strip() for seg in preview_segments)
        if preview_text:
            print_progress(92, preview_text + "...")
    
    # Показываем начало финального текста
    print_progress(95, text[:300] + ("..." if len(text) > 300 else ""))
    
    # Сохраняем результат
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(text, encoding="utf-8")
    
    print_progress(100, text)
    
    # Финальное сообщение
    final_data = {
        "type": "complete",
        "language": language,
        "length": len(text),
        "text": text
    }
    print(json.dumps(final_data), flush=True)


def main():
    """Точка входа скрипта"""
    if len(sys.argv) < 3:
        error_data = {
            "type": "error",
            "message": "Недостаточно аргументов"
        }
        print(json.dumps(error_data), file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    model_size = sys.argv[3] if len(sys.argv) > 3 else "large"
    
    try:
        transcribe_file(input_file, output_file, model_size)
    except Exception as error:
        error_data = {
            "type": "error",
            "message": str(error)
        }
        print(json.dumps(error_data), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()