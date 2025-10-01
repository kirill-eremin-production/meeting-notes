#!/bin/bash

# Загрузка общих функций
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Установка зависимостей Python
setup_python_dependencies() {
    local pure_python="${1:-false}"
    
    log_step "Установка зависимостей Python"
    
    # Установка python3-venv если не установлен
    log_info "Проверка и установка необходимых пакетов Python..."
    sudo apt-get update -qq
    sudo apt-get install -y python3-venv python3-full python3-pip python3-setuptools
    check_status "Не удалось установить системные пакеты Python"
    
    # Если включен режим pure_python - полная переустановка
    if [ "$pure_python" = "true" ]; then
        if [ -d "venv" ]; then
            log_warning "Режим --pure_python: удаление существующего виртуального окружения..."
            rm -rf venv
        fi
        
        log_info "Режим --pure_python: создание нового виртуального окружения..."
        python3 -m venv venv --clear --system-site-packages
    
    # Проверка создания виртуального окружения с подробной диагностикой
    if [ ! -d "venv" ]; then
        log_error "Директория venv не создана"
        exit 1
    fi
    
    if [ ! -f "venv/bin/python" ]; then
        log_error "Файл venv/bin/python не найден. Содержимое venv:"
        ls -la venv/
        if [ -d "venv/bin" ]; then
            log_error "Содержимое venv/bin:"
            ls -la venv/bin/
        fi
        exit 1
    fi
    
        # Установка зависимостей через python -m pip (более надежный способ)
        log_info "Установка зависимостей в виртуальное окружение..."
        ./venv/bin/python -m pip install --upgrade pip setuptools wheel
        check_status "Не удалось обновить pip"
        
        # Сначала устанавливаем CPU-версию PyTorch (без CUDA, намного легче - ~200MB вместо 2GB+)
        log_info "Установка PyTorch CPU-версии (без GPU зависимостей)..."
        ./venv/bin/python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
        check_status "Не удалось установить PyTorch"
        
        # Теперь устанавливаем Whisper и tqdm
        log_info "Установка openai-whisper и tqdm..."
        ./venv/bin/python -m pip install openai-whisper tqdm
        check_status "Не удалось установить зависимости Python"
        
        log_info "Зависимости Python успешно установлены (оптимизировано для CPU)"
    else
        # Проверяем наличие venv
        if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
            log_info "Виртуальное окружение venv уже существует, пропускаем установку"
            log_info "Используйте --pure_python для полной переустановки"
        else
            log_info "venv не найден, выполняется создание и установка..."
            
            python3 -m venv venv --clear --system-site-packages
            
            # Проверка создания виртуального окружения с подробной диагностикой
            if [ ! -d "venv" ]; then
                log_error "Директория venv не создана"
                exit 1
            fi
            
            if [ ! -f "venv/bin/python" ]; then
                log_error "Файл venv/bin/python не найден. Содержимое venv:"
                ls -la venv/
                if [ -d "venv/bin" ]; then
                    log_error "Содержимое venv/bin:"
                    ls -la venv/bin/
                fi
                exit 1
            fi
            
            # Установка зависимостей
            log_info "Установка зависимостей в виртуальное окружение..."
            ./venv/bin/python -m pip install --upgrade pip setuptools wheel
            check_status "Не удалось обновить pip"
            
            log_info "Установка PyTorch CPU-версии (без GPU зависимостей)..."
            ./venv/bin/python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
            check_status "Не удалось установить PyTorch"
            
            log_info "Установка openai-whisper и tqdm..."
            ./venv/bin/python -m pip install openai-whisper tqdm
            check_status "Не удалось установить зависимости Python"
            
            log_info "Зависимости Python успешно установлены (оптимизировано для CPU)"
        fi
    fi
    
    echo ""
}