from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.db import get_db
from app.services.user_service import UserService


async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Зависимость, предоставляющая экземпляр UserService."""
    return UserService(db)
