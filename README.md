# UDV Team Map

## Проект

**UDV Team Map** — корпоративный портал для сотрудников компании UDV, объединяющий информацию о сотрудниках и организационной структуре в одном удобном интерфейсе.

## Идея

Создать «карту команды», которая позволяет быстро ориентироваться в компании, находить коллег для рабочих задач и знакомиться с командой.

## Цель

Повысить прозрачность структуры компании, упростить поиск сотрудников и облегчить адаптацию новых сотрудников за счет единого хранилища актуальной информации.

> **Статус:** проект находится в разработке.

## Ветка проекта

Проект нужно открывать в ветке `feature/hr-table-updates`:

```bash
git checkout feature/hr-table-updates
```

## Роли для входа

В системе доступны две роли:

- **Администратор (Admin)** - полный доступ ко всем функциям системы

  - Email: `admin@udvteam.map`
  - Пароль: `admin123`

- **Пользователь (User)** - стандартный доступ к функциям
  - Email: `employee@udvteam.map`
  - Пароль: `employee123`

## Запуск проекта

### Предварительные требования

- Python 3.12+
- Node.js 18+ и npm
- PostgreSQL
- Poetry (для управления зависимостями Python)

### Запуск бэкенда

1. Перейдите в директорию бэкенда:

   ```bash
   cd backend
   ```

2. Установите зависимости через Poetry:

   ```bash
   poetry install
   ```

3. Создайте файл `.env` в директории `backend/` со следующими переменными:

   ```env
   SECRET_KEY=your-secret-key-here
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=your_database_name
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   S3_ROOT_USER=your_s3_user
   S3_ROOT_PASSWORD=your_s3_password
   S3_USER_AVATAR_BUCKET=your_bucket_name
   S3_REGION=your_region
   S3_ENDPOINT=your_s3_endpoint
   S3_PUBLIC_ENDPOINT=your_public_endpoint
   PROMETHEUS_HOST=localhost
   PROMETHEUS_PORT=9090
   ```

4. Примените миграции базы данных:

   ```bash
   poetry run alembic upgrade head
   ```

5. Запустите сервер:

   ```bash
   poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Бэкенд будет доступен по адресу: `http://localhost:8000`
   Документация API: `http://localhost:8000/api/docs`

### Запуск фронтенда

1. Перейдите в директорию фронтенда:

   ```bash
   cd frontend
   ```

2. Установите зависимости:

   ```bash
   npm install
   ```

3. Запустите dev-сервер:

   ```bash
   npm run dev
   ```

   Фронтенд будет доступен по адресу: `http://localhost:5173`

### Порядок запуска

1. Убедитесь, что PostgreSQL запущен и база данных создана
2. Запустите бэкенд (порт 8000)
3. Запустите фронтенд (порт 5173)
4. Откройте браузер и перейдите на `http://localhost:5173`
