#!/bin/bash

# Загрузка общих функций и конфигурации
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"
source "${SCRIPT_DIR}/config.sh"

# Настройка и запуск PM2
setup_pm2() {
    log_step "Настройка процесс-менеджера PM2"
    
    # Проверка и установка PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 не установлен. Устанавливаю..."
        sudo npm install -g pm2
        check_status "Не удалось установить PM2"
    fi
    
    # Остановка старого процесса если запущен
    pm2 stop "${APP_NAME}" 2>/dev/null || true
    pm2 delete "${APP_NAME}" 2>/dev/null || true
    
    # Запуск приложения через PM2
    log_info "Запуск приложения через PM2..."
    pm2 start npm --name "${APP_NAME}" -- run start:prod
    check_status "Не удалось запустить приложение"
    
    # Сохранение конфигурации PM2
    pm2 save
    pm2 startup systemd -u $(whoami) --hp $(echo $HOME) | grep "sudo" | bash
    
    echo ""
}

# Вывод информации о приложении
print_app_info() {
    log_info "✅ Развертывание завершено успешно!"
    echo ""
    log_info "Приложение запущено на порту ${APP_PORT}"
    log_info "Проверьте работу: http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
    echo ""
    log_info "Управление приложением:"
    echo "  - Статус:      pm2 status ${APP_NAME}"
    echo "  - Логи:        pm2 logs ${APP_NAME}"
    echo "  - Перезапуск:  pm2 restart ${APP_NAME}"
    echo "  - Остановка:   pm2 stop ${APP_NAME}"
    echo ""
}