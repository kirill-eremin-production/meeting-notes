# Декомпозированные скрипты развертывания

Эта директория содержит модульную структуру скриптов для развертывания приложения на удаленном сервере.

## Структура

```
.scripts/deploy/
├── common.sh         # Общие функции (логирование, проверка статуса)
├── config.sh         # Конфигурация (переменные окружения)
├── check-deps.sh     # Проверка и установка системных зависимостей
├── repo.sh           # Управление Git репозиторием
├── node-setup.sh     # Установка Node.js зависимостей
├── python-setup.sh   # Установка Python зависимостей и виртуального окружения
├── build.sh          # Сборка приложения
├── pm2-setup.sh      # Настройка и запуск PM2
├── remote-deploy.sh  # Главный скрипт для выполнения на сервере
└── README.md         # Эта документация
```

## Как это работает

### 1. Локальная структура
Все модули хранятся локально в `.scripts/deploy/`

### 2. Передача на сервер
При запуске [`deploy.sh`](../../deploy.sh:1):
- Создается директория `~/.deploy-scripts/` на удаленном сервере
- Все модули копируются на сервер через `scp`
- Запускается [`remote-deploy.sh`](.scripts/deploy/remote-deploy.sh:1) на сервере

### 3. Выполнение на сервере
[`remote-deploy.sh`](.scripts/deploy/remote-deploy.sh:1) загружает модули через `source` и выполняет функции:
```bash
source ~/.deploy-scripts/common.sh
source ~/.deploy-scripts/config.sh
source ~/.deploy-scripts/check-deps.sh
# ... и так далее
```

### 4. Модульность на сервере
После развертывания модули остаются на сервере в `~/.deploy-scripts/`, что позволяет:
- Редактировать конфигурацию напрямую на сервере
- Запускать отдельные модули вручную
- Переиспользовать модули в других скриптах

## Описание модулей

### common.sh
Содержит общие функции для всех скриптов:
- `log_info()` - информационные сообщения (зеленый)
- `log_error()` - сообщения об ошибках (красный)
- `log_warning()` - предупреждения (желтый)
- `log_step()` - заголовки шагов (синий)
- `check_status()` - проверка статуса выполнения команды

### config.sh
Центральное место для всех конфигурационных переменных:
- `GITHUB_REPO` - URL Git репозитория
- `APP_DIR` - директория приложения на сервере
- `APP_PORT` - порт приложения
- `APP_NAME` - имя процесса в PM2

### check-deps.sh
Функция `check_and_install_dependencies()` проверяет и устанавливает:
- Git
- ffmpeg (для Whisper)
- Node.js 22.x
- npm
- Python3
- pip3

### repo.sh
Функция `setup_repository()` управляет Git репозиторием:
- Клонирует репозиторий при первом развертывании
- Обновляет существующий репозиторий
- Автоматически определяет основную ветку (main/master)

### node-setup.sh
Функция `setup_node_dependencies()` устанавливает зависимости Node.js:
- Принимает параметр `pure_js` (true/false)
- Если `pure_js=true`: удаляет `node_modules` и выполняет полную установку
- Если `pure_js=false` и `node_modules` существует: пропускает установку
- Если `pure_js=false` и `node_modules` не существует: выполняет установку

### python-setup.sh
Функция `setup_python_dependencies()` настраивает Python окружение:
- Принимает параметр `pure_python` (true/false)
- Устанавливает системные пакеты Python
- Если `pure_python=true`: удаляет `venv` и создает новое виртуальное окружение
- Если `pure_python=false` и `venv` существует: пропускает установку
- Если `pure_python=false` и `venv` не существует: создает окружение и устанавливает зависимости
- Устанавливает PyTorch (CPU-версию)
- Устанавливает Whisper и другие зависимости

### build.sh
Функции для сборки и подготовки:
- `build_application()` - запускает `npm run build`
- `create_directories()` - создает необходимые директории (`uploads`)

### pm2-setup.sh
Функции для PM2:
- `setup_pm2()` - настраивает процесс-менеджер PM2
- `print_app_info()` - выводит информацию о развернутом приложении

### remote-deploy.sh
Главный скрипт для выполнения на сервере:
- Загружает все модули через `source`
- Вызывает функции в правильном порядке
- Координирует весь процесс развертывания

## Использование

### Основной способ развертывания

Используйте главный скрипт [`deploy.sh`](../../deploy.sh:1) из корня проекта:

```bash
./deploy.sh user@server_ip [--pure_js] [--pure_python]
```

Например:
```bash
# Обычное развертывание (не переустанавливает существующие зависимости)
./deploy.sh kirilleremin@89.169.145.217

# Полная переустановка всех зависимостей
./deploy.sh kirilleremin@89.169.145.217 --pure_js --pure_python

# Переустановка только Node.js зависимостей
./deploy.sh kirilleremin@89.169.145.217 --pure_js

# Переустановка только Python зависимостей
./deploy.sh kirilleremin@89.169.145.217 --pure_python
```

#### Параметры

- `--pure_js` - Полная переустановка Node.js зависимостей (удаляет `node_modules` и выполняет `npm install`)
- `--pure_python` - Полная переустановка Python зависимостей (удаляет `venv` и создает новое виртуальное окружение)

**Без этих параметров:**
- Если `node_modules` уже существует, установка Node.js зависимостей будет пропущена
- Если `venv` уже существует, установка Python зависимостей будет пропущена

Это значительно ускоряет повторные развертывания, когда зависимости не изменились.

Скрипт автоматически:
1. Проверит SSH подключение
2. Создаст директорию `~/.deploy-scripts/` на сервере
3. Скопирует все модули на сервер
4. Запустит процесс развертывания

### Использование модулей на сервере

После первого развертывания модули доступны на сервере в `~/.deploy-scripts/`.

Вы можете подключиться к серверу и использовать их:

```bash
# Подключиться к серверу
ssh user@server_ip

# Загрузить модули
source ~/.deploy-scripts/common.sh
source ~/.deploy-scripts/config.sh

# Использовать функции
log_info "Тестовое сообщение"

# Или запустить весь процесс заново
bash ~/.deploy-scripts/remote-deploy.sh
```

### Запуск отдельных шагов

Вы можете запустить отдельные этапы развертывания:

```bash
# На сервере
source ~/.deploy-scripts/common.sh
source ~/.deploy-scripts/config.sh
source ~/.deploy-scripts/repo.sh

# Только обновить репозиторий
setup_repository
```

## Изменение конфигурации

### Локально (перед развертыванием)

Отредактируйте [`config.sh`](.scripts/deploy/config.sh:1):

```bash
GITHUB_REPO="https://github.com/your-username/your-repo.git"
APP_DIR="your-app-name"
APP_PORT="8080"
APP_NAME="your-service-name"
```

### На сервере (после развертывания)

```bash
# Подключиться к серверу
ssh user@server_ip

# Отредактировать конфигурацию
nano ~/.deploy-scripts/config.sh

# Перезапустить развертывание с новой конфигурацией
bash ~/.deploy-scripts/remote-deploy.sh
```

## Преимущества этого подхода

1. **Настоящая модульность** - каждый модуль независим и может использоваться отдельно
2. **Гибкость** - можно редактировать модули как локально, так и на сервере
3. **Переиспользование** - функции доступны для других скриптов на сервере
4. **Отладка** - легко тестировать отдельные модули
5. **Читаемость** - каждый файл отвечает за одну задачу
6. **Поддержка** - изменения вносятся точечно в конкретные модули
7. **Персистентность** - модули остаются на сервере между развертываниями

## Отладка

### Локальная отладка

```bash
# Включить подробный вывод
set -x

# Загрузить модуль
source .scripts/deploy/common.sh
source .scripts/deploy/config.sh
source .scripts/deploy/check-deps.sh

# Выполнить функцию
check_and_install_dependencies

# Отключить подробный вывод
set +x
```

### Отладка на сервере

```bash
# Подключиться к серверу
ssh user@server_ip

# Включить подробный вывод в remote-deploy.sh
bash -x ~/.deploy-scripts/remote-deploy.sh
```

## Добавление новых модулей

1. Создайте новый файл в `.scripts/deploy/`, например `database.sh`
2. Добавьте стандартный заголовок:
   ```bash
   #!/bin/bash
   
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   source "${SCRIPT_DIR}/common.sh"
   source "${SCRIPT_DIR}/config.sh"
   ```
3. Создайте функцию с понятным именем:
   ```bash
   setup_database() {
       log_step "Настройка базы данных"
       # ваш код
   }
   ```
4. Добавьте модуль в [`deploy.sh`](../../deploy.sh:1) для копирования:
   ```bash
   scp "${SCRIPT_DIR}/.scripts/deploy/database.sh" "${SERVER}:~/${REMOTE_SCRIPT_DIR}/"
   ```
5. Добавьте загрузку в [`remote-deploy.sh`](.scripts/deploy/remote-deploy.sh:1):
   ```bash
   source "${REMOTE_SCRIPT_DIR}/database.sh"
   ```
6. Используйте функцию в `main()`:
   ```bash
   main() {
       check_and_install_dependencies
       setup_database  # новая функция
       setup_repository
       # ...
   }
   ```
7. Обновите документацию

## Структура на сервере после развертывания

```
~/
├── .deploy-scripts/          # Модули развертывания
│   ├── common.sh
│   ├── config.sh
│   ├── check-deps.sh
│   ├── repo.sh
│   ├── node-setup.sh
│   ├── python-setup.sh
│   ├── build.sh
│   ├── pm2-setup.sh
│   └── remote-deploy.sh
│
└── meeting-notes/            # Приложение
    ├── src/
    ├── node_modules/
    ├── venv/
    └── ...