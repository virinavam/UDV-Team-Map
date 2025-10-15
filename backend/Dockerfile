FROM python:3.12.12-alpine3.22

# 1. Установка системных зависимостей
RUN apk add --no-cache \
    gcc musl-dev libffi-dev openssl-dev postgresql-dev \
    libpq \
    && pip install poetry  # Установка Poetry

# 2. Настройка рабочей директории и изоляции
WORKDIR /app
COPY pyproject.toml poetry.lock /app/
RUN poetry config virtualenvs.in-project true
RUN poetry install --no-root --only main

# 3. Установка переменных окружения (КРИТИЧНО для запуска)
# Добавляем бинарники venv в PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/app:/app/.venv/lib/python3.12/site-packages:$PYTHONPATH"

# 4. Копирование кода
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY alembic.ini /app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]