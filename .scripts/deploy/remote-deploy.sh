#!/bin/bash

# Скрипт для выполнения на удаленном сервере
# Использует декомпозированные модули через source

# Определяем директорию скриптов на удаленном сервере
REMOTE_SCRIPT_DIR="$HOME/.deploy-scripts"

# Получаем параметры чистой установки
PURE_JS="${1:-false}"
PURE_PYTHON="${2:-false}"

# Экспортируем для использования в модулях
export PURE_JS
export PURE_PYTHON

# Загружаем общие функции и конфигурацию
source "${REMOTE_SCRIPT_DIR}/common.sh"
source "${REMOTE_SCRIPT_DIR}/config.sh"

# Загружаем модули
source "${REMOTE_SCRIPT_DIR}/check-deps.sh"
source "${REMOTE_SCRIPT_DIR}/repo.sh"
source "${REMOTE_SCRIPT_DIR}/node-setup.sh"
source "${REMOTE_SCRIPT_DIR}/python-setup.sh"
source "${REMOTE_SCRIPT_DIR}/build.sh"
source "${REMOTE_SCRIPT_DIR}/pm2-setup.sh"

# Главная функция выполнения
main() {
    check_and_install_dependencies
    setup_repository
    setup_node_dependencies "${PURE_JS}"
    setup_python_dependencies "${PURE_PYTHON}"
    build_application
    create_directories
    setup_pm2
    print_app_info
}

# Запуск главной функции
main