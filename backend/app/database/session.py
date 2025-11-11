from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Создаём движок
engine = create_async_engine(settings.DATABASE_URL_ASYNC)

# Фабрика сессий
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Зависимость
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session