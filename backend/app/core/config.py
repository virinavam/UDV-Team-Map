from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, computed_field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --------------------------------------------------------------------------
    # Основные параметры проекта
    # --------------------------------------------------------------------------
    PROJECT_NAME: str = "UDV Team Map API"
    VERSION: str = "0.0.1"
    SECRET_KEY: str = Field(..., description="Секретный ключ для JWT/сессий")
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_DAYS: int = 1
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    ADMIN_DEFAULT_EMAIL: str = "sys.admin@example.com"
    ADMIN_DEFAULT_PASSWORD: str = "secure_sys_admin_password"
    HR_DEFAULT_EMAIL: str = "hr.admin@example.com"
    HR_DEFAULT_PASSWORD: str = "secure_hr_admin_password"

    # --------------------------------------------------------------------------
    # Настройки PostgreSQL
    # --------------------------------------------------------------------------
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    # --------------------------------------------------------------------------
    # Настройки S3
    # --------------------------------------------------------------------------
    S3_ROOT_USER: str
    S3_ROOT_PASSWORD: str
    S3_HOST: str
    S3_PORT: int

    # --------------------------------------------------------------------------
    # Настройки Prometheus
    # --------------------------------------------------------------------------
    PROMETHEUS_HOST: str
    PROMETHEUS_PORT: int

    @computed_field
    @property
    def DATABASE_URL_ASYNC(self) -> str:
        """Асинхронный URL для SQLAlchemy/Alembic."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL(self) -> str:
        """Синхронный URL для SQLAlchemy."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def S3_URL(self) -> str:
        return f"http://{self.S3_HOST}:{self.S3_PORT}"


settings = Settings()
