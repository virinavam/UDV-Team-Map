import asyncio
import os
import sys
from logging.config import fileConfig

# 1. Добавляем корень проекта (backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

# 2. Добавляем папку приложения (backend/app/)
APP_ROOT = os.path.join(PROJECT_ROOT, 'app')
sys.path.append(APP_ROOT)
# -----------------------------

from sqlalchemy import pool

try:
    from app.db.base import Base
    from app.models.user import User # Импорт модели гарантирует, что она будет видна
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing modules for Alembic: {e}. Check PYTHONPATH.")
    raise e
# --------------------------------------------------------------------------

from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# Устанавливаем URL в конфигурацию (чтобы он был доступен в env.py)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_ASYNC)


def run_migrations_offline() -> None:
    # Эту функцию можно оставить без изменений, она работает с URL, а не с подключением
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Выполняет миграции синхронно в рамках асинхронного соединения."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # include_symbol=my_include_object,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Запускает миграции в 'online' режиме, используя асинхронный движок."""
    connectable = create_async_engine(  # <-- АСИНХРОННЫЙ ДВИЖОК
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    async def run_async_migrations():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

        await connectable.dispose()

    asyncio.run(run_async_migrations())
