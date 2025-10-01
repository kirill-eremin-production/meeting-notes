#!/bin/bash

# Загрузка общих функций
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Сборка приложения
build_application() {
    log_step "Сборка приложения"
    
    npm run build
    check_status "Не удалось собрать приложение"
    
    echo ""
}

# Создание необходимых директорий
create_directories() {
    log_step "Создание необходимых директорий"
    
    mkdir -p uploads
    log_info "Папка uploads создана"
    
    echo ""
}