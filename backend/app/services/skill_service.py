from typing import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.skill import SkillAlreadyExists, SkillNotFound
from app.models.skill import Skill
from app.repositories.skill_repository import SkillRepository
from app.schemas.skill import SkillCreate, SkillUpdate


class SkillService:
    def __init__(self, db: AsyncSession):
        self.skill_repo = SkillRepository(db)

    async def _check_unique_name(self, name: str, ignore_id: UUID | None = None):
        """Проверяет, что навык с таким именем не существует."""
        existing = await self.skill_repo.get_skill_by_name(name)

        if existing and existing.id != ignore_id:
            raise SkillAlreadyExists(name)

    async def create_skill(self, create_data: SkillCreate) -> Skill:
        """Создает новый навык."""
        await self._check_unique_name(create_data.name)

        new_skill = await self.skill_repo.create_skill(create_data.name)
        return new_skill

    async def get_skill(self, skill_id: UUID) -> Skill:
        """Получает навык по ID."""
        skill = await self.skill_repo.get_by_id(skill_id)

        if not skill:
            raise SkillNotFound(skill_id)
        return skill

    async def get_all_skills(self) -> Sequence[Skill]:
        """Получает список всех навыков."""
        return await self.skill_repo.get_all_skills()

    async def update_skill(self, skill_id: UUID, updates: SkillUpdate) -> Skill:
        """Обновляет данные навыка."""
        skill = await self.skill_repo.get_by_id(skill_id)

        if not skill:
            raise SkillNotFound(skill_id)

        update_data = updates.model_dump(exclude_unset=True)

        if "name" in update_data:
            new_name = update_data["name"]
            await self._check_unique_name(new_name, ignore_id=skill.id)
            skill = await self.skill_repo.update_skill_name(skill, new_name)

        return skill

    async def delete_skill(self, skill_id: UUID):
        """Удаляет навык."""
        skill = await self.skill_repo.get_by_id(skill_id)

        if not skill:
            raise SkillNotFound(skill_id)

        await self.skill_repo.delete_skill(skill)
