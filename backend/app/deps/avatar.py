from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.db import get_db
from app.deps.s3 import get_s3_service
from app.services.avatar_service import AvatarService


async def get_avatar_service(db: AsyncSession = Depends(get_db)) -> AvatarService:
    """Зависимость, предоставляющая экземпляр AvatarService."""
    return AvatarService(db, get_s3_service())
