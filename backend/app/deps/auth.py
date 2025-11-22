from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.db import get_db
from app.services.auth_service import AuthService


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Зависимость, предоставляющая экземпляр AuthService."""
    return AuthService(db)
