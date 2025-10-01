#!/bin/bash

# Загрузка общих функций и конфигурации
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"
source "${SCRIPT_DIR}/config.sh"

# Клонирование или обновление репозитория
setup_repository() {
    log_step "Клонирование/обновление репозитория"
    
    cd ~ || exit 1
    
    if [ -d "${APP_DIR}" ]; then
        log_info "Репозиторий уже существует. Обновляю..."
        cd "${APP_DIR}" || exit 1
        
        # Получаем обновления
        git fetch origin
        
        # Определяем основную ветку
        MAIN_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)
        if [ -z "$MAIN_BRANCH" ]; then
            MAIN_BRANCH="main"
        fi
        
        log_info "Основная ветка: ${MAIN_BRANCH}"
        
        # Сбрасываем локальные изменения и переключаемся на актуальную версию
        git reset --hard origin/${MAIN_BRANCH}
        check_status "Не удалось обновить репозиторий"
        
        log_info "Репозиторий успешно обновлен"
    else
        log_info "Клонирую репозиторий..."
        git clone "${GITHUB_REPO}" "${APP_DIR}"
        check_status "Не удалось клонировать репозиторий"
        
        cd "${APP_DIR}" || exit 1
        log_info "Репозиторий успешно клонирован"
    fi
    
    echo ""
}