#!/bin/bash

# Загрузка общих функций
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Проверка и установка системных зависимостей
check_and_install_dependencies() {
    log_step "Проверка установленных компонентов"
    
    # Проверка Git
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен. Устанавливаю..."
        sudo apt-get update && sudo apt-get install -y git
        check_status "Не удалось установить Git"
    fi
    log_info "Git: $(git --version)"
    
    # Проверка ffmpeg (необходим для Whisper)
    if ! command -v ffmpeg &> /dev/null; then
        log_warning "ffmpeg не установлен. Устанавливаю..."
        sudo apt-get install -y ffmpeg
        check_status "Не удалось установить ffmpeg"
    fi
    log_info "ffmpeg: $(ffmpeg -version | head -n1)"
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js не установлен. Устанавливаю Node.js 22.x..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
        check_status "Не удалось установить Node.js"
    fi
    log_info "Node.js: $(node --version)"
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        log_error "npm не установлен"
        exit 1
    fi
    log_info "npm: $(npm --version)"
    
    # Проверка Python3
    if ! command -v python3 &> /dev/null; then
        log_warning "Python3 не установлен. Устанавливаю..."
        sudo apt-get install -y python3 python3-pip
        check_status "Не удалось установить Python3"
    fi
    log_info "Python3: $(python3 --version)"
    
    # Проверка pip3
    if ! command -v pip3 &> /dev/null; then
        log_warning "pip3 не установлен. Устанавливаю..."
        sudo apt-get install -y python3-pip
        check_status "Не удалось установить pip3"
    fi
    log_info "pip3: $(pip3 --version)"
    
    echo ""
}