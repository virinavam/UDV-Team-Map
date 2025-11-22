from typing import List, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import get_logger
from app.models.skills import Skill

logger = get_logger()


class SkillRepository:
    """
    Репозиторий для управления операциями с моделью Skill.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_skills(self) -> Sequence[Skill]:
        """
        Возвращает список всех существующих навыков, отсортированных по имени.
        """
        logger.info("Fetching all skills from the database.")
        stmt = select(Skill).order_by(func.lower(Skill.name))
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_skill_by_name(self, name: str) -> Skill | None:
        """
        Ищет навык по имени (регистронезависимо).
        """
        name_lower = name.lower()
        stmt = select(Skill).filter(func.lower(Skill.name) == name_lower)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_skills_by_names(self, names: List[str]) -> Sequence[Skill]:
        """
        Получает список объектов Skill по списку их названий.
        """
        if not names:
            return []
        names_lower = [name.lower() for name in names]
        stmt = select(Skill).filter(func.lower(Skill.name).in_(names_lower))
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id(self, skill_id: UUID):
        """
        Ищет навык по ID.
        """
        stmt = select(Skill).filter(Skill.id == skill_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_skill(self, name: str) -> Skill:
        """
        Создает новый навык в базе данных.
        """
        logger.info("Creating new skill: %s", name)
        new_skill = Skill(name=name)
        self.db.add(new_skill)
        await self.db.commit()
        await self.db.refresh(new_skill)
        return new_skill

    async def update_skill_name(self, skill: Skill, new_name: str) -> Skill:
        """
        Обновляет название существующего навыка.
        """
        logger.info("Updating skill ID %s name from '%s' to '%s'", skill.id, skill.name, new_name)
        skill.name = new_name
        await self.db.flush()
        return skill

    async def delete_skill(self, skill: Skill) -> None:
        """
        Удаляет навык из базы данных.
        """
        logger.warning("Deleting skill ID %s ('%s')", skill.id, skill.name)
        await self.db.delete(skill)
        await self.db.commit()
