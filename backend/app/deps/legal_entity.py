from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.db import get_db
from app.services.legal_entity_service import LegalEntityService


async def get_le_service(db: AsyncSession = Depends(get_db)) -> LegalEntityService:
    """Зависимость, предоставляющая экземпляр LegalEntityService."""
    return LegalEntityService(db)
