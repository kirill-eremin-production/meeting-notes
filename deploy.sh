#!/bin/bash

# Загрузка общих функций и конфигурации
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/.scripts/deploy/common.sh"
source "${SCRIPT_DIR}/.scripts/deploy/config.sh"

# Проверка аргументов
if [ -z "$1" ]; then
    log_error "Не указан адрес сервера"
    echo "Использование: ./deploy.sh user@server_ip [--pure_js] [--pure_python]"
    echo "Пример: ./deploy.sh kirilleremin@89.169.145.217"
    echo "Пример: ./deploy.sh kirilleremin@89.169.145.217 --pure_js --pure_python"
    echo ""
    echo "Параметры:"
    echo "  --pure_js      Полная переустановка Node.js зависимостей (удаление node_modules)"
    echo "  --pure_python  Полная переустановка Python зависимостей (удаление venv)"
    exit 1
fi

SERVER="$1"
REMOTE_SCRIPT_DIR=".deploy-scripts"

# Обработка параметров
PURE_JS="false"
PURE_PYTHON="false"

shift # Пропускаем первый аргумент (SERVER)
while [[ $# -gt 0 ]]; do
    case $1 in
        --pure_js)
            PURE_JS="true"
            shift
            ;;
        --pure_python)
            PURE_PYTHON="true"
            shift
            ;;
        *)
            log_warning "Неизвестный параметр: $1"
            shift
            ;;
    esac
done

log_info "🚀 Начало развертывания приложения на сервере ${SERVER}"
if [ "$PURE_JS" = "true" ] || [ "$PURE_PYTHON" = "true" ]; then
    log_info "Режимы чистой установки:"
    [ "$PURE_JS" = "true" ] && log_info "  - Node.js зависимости будут полностью переустановлены"
    [ "$PURE_PYTHON" = "true" ] && log_info "  - Python зависимости будут полностью переустановлены"
fi
echo ""

# Проверка SSH подключения
log_step "Проверка SSH подключения к серверу..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "${SERVER}" "echo 'SSH OK'" &>/dev/null; then
    log_warning "Не удалось подключиться без пароля. Убедитесь, что:"
    echo "  1. SSH ключ добавлен на сервер (ssh-copy-id ${SERVER})"
    echo "  2. Сервер доступен по сети"
    echo ""
    log_info "Попытка подключения с паролем..."
fi

# Создание директории для скриптов на удаленном сервере
log_step "Подготовка директории для скриптов на сервере..."
ssh "${SERVER}" "mkdir -p ~/${REMOTE_SCRIPT_DIR}"

# Передача всех модулей на сервер
log_step "Передача модулей на сервер..."
scp "${SCRIPT_DIR}/.scripts/deploy/common.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/config.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/check-deps.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/repo.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/node-setup.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/python-setup.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/build.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/pm2-setup.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
scp "${SCRIPT_DIR}/.scripts/deploy/remote-deploy.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"

log_info "Модули успешно переданы на сервер"
echo ""

# Выполнение скрипта развертывания на удаленном сервере
log_step "Запуск процесса развертывания на сервере..."
ssh "${SERVER}" "bash ~/${REMOTE_SCRIPT_DIR}/remote-deploy.sh ${PURE_JS} ${PURE_PYTHON}"

# Проверка результата выполнения
if [ $? -eq 0 ]; then
    echo ""
    log_info "🎉 Приложение успешно развернуто на сервере ${SERVER}"
    log_info "Приложение доступно по адресу: http://${SERVER#*@}:${APP_PORT}"
    echo ""
    log_info "💡 Модули развертывания сохранены на сервере в ~/${REMOTE_SCRIPT_DIR}/"
    log_info "Вы можете редактировать их напрямую на сервере для настройки"
else
    log_error "Произошла ошибка при развертывании"
    exit 1
fi