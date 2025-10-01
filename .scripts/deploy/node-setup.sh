#!/bin/bash

# Загрузка общих функций
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Установка зависимостей Node.js
setup_node_dependencies() {
    local pure_js="${1:-false}"
    
    log_step "Установка зависимостей Node.js"
    
    # Если включен режим pure_js - полная переустановка
    if [ "$pure_js" = "true" ]; then
        if [ -d "node_modules" ]; then
            log_warning "Режим --pure_js: удаление папки node_modules..."
            rm -rf node_modules
        fi
        
        log_info "Режим --pure_js: установка зависимостей..."
        npm install
        check_status "Не удалось установить зависимости Node.js"
    else
        # Проверяем наличие node_modules
        if [ -d "node_modules" ]; then
            log_info "node_modules уже существует, пропускаем установку"
            log_info "Используйте --pure_js для полной переустановки"
        else
            log_info "node_modules не найден, выполняется установка..."
            npm install
            check_status "Не удалось установить зависимости Node.js"
        fi
    fi
    
    echo ""
}