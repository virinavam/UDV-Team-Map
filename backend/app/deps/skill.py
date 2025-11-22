from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.db import get_db
from app.services.skill_service import SkillService


async def get_skill_service(db: AsyncSession = Depends(get_db)) -> SkillService:
    """Зависимость, предоставляющая экземпляр SkillService."""
    return SkillService(db)
