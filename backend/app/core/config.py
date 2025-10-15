from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


# ----------------------------------------------------
# 1. ОСНОВНЫЕ НАСТРОЙКИ
# ----------------------------------------------------

class Settings(BaseSettings):
    # Указываем Pydantic, что нужно искать переменные в файле .env
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # Игнорировать переменные в .env, которых нет в классе
    )

    # Общие настройки проекта
    PROJECT_NAME: str = "FastAPI Base Project"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = Field(..., description="Секретный ключ для JWT/сессий")

    # ----------------------------------------------------
    # 2. НАСТРОЙКИ БАЗЫ ДАННЫХ (PostgreSQL)
    # ----------------------------------------------------

    # Pydantic автоматически собирает DSN (строку подключения) из отдельных частей
    # или использует полную строку, если она задана.
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "db" # Используем имя сервиса 'db' из docker-compose
    POSTGRES_PORT: int = 5432 # Используем порт сервиса 'db' из docker-compose

    # DSN (Data Source Name) для синхронного и асинхронного подключения
    # Pydantic Dsn - это валидатор, гарантирующий правильный формат URL.
    # Это DSN для SQLAlchemy ORM (asyncpg)
    DATABASE_URL_ASYNC: str = ""  # Будет заполнено в методе __init__

    # ----------------------------------------------------
    # 3. НАСТРОЙКИ MINIO
    # ----------------------------------------------------
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_HOST: str = "minio"  # Имя сервиса MinIO в docker-compose
    MINIO_PORT: int = 9000

    # ----------------------------------------------------
    # 4. НАСТРОЙКИ МОНИТОРИНГА
    # ----------------------------------------------------
    PROMETHEUS_HOST: str = "prometheus"
    PROMETHEUS_PORT: int = 9090

    def __init__(self, **values):
        super().__init__(**values)

        # Генерируем асинхронный URL после загрузки всех переменных
        # Используем postgresql+asyncpg:// для асинхронного драйвера
        self.DATABASE_URL_ASYNC = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()