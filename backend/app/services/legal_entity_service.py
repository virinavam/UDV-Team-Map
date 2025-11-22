from typing import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.legal_entity import LegalEntityAlreadyExists, LegalEntityInUse, LegalEntityNotFound
from app.models import LegalEntity
from app.repositories.legal_entity_repository import LegalEntityRepository
from app.schemas.legal_entity import LegalEntityUpdate


class LegalEntityService:
    def __init__(self, db: AsyncSession):
        self.le_repository = LegalEntityRepository(db)

    async def _check_unique_name(self, name: str, ignore_id: UUID | None = None):
        """Проверяет уникальность имени юридического лица."""
        existing = await self.le_repository.get_by_name(name)
        if existing and existing.id != ignore_id:
            raise LegalEntityAlreadyExists(name)

    async def get_legal_entity(self, legal_entity_id: UUID) -> LegalEntity:
        entity = await self.le_repository.get_by_id(legal_entity_id)
        if not entity:
            raise LegalEntityNotFound(legal_entity_id)
        return entity

    async def get_legal_entity_by_name(self, name: str) -> LegalEntity | None:
        return await self.le_repository.get_by_name(name)

    async def get_all_legal_entities(self) -> Sequence[LegalEntity]:
        return await self.le_repository.get_all_legal_entities()

    async def create_legal_entity(self, name: str) -> LegalEntity:
        await self._check_unique_name(name)
        return await self.le_repository.create_legal_entity(name)

    async def update_legal_entity(self, legal_entity_id: UUID, updates: LegalEntityUpdate) -> LegalEntity:
        update_data = updates.model_dump(exclude_unset=True)
        if "name" in update_data:
            await self._check_unique_name(update_data["name"], ignore_id=legal_entity_id)
        updated_entity = await self.le_repository.update_legal_entity(legal_entity_id, update_data)
        if not updated_entity:
            raise LegalEntityNotFound(legal_entity_id)
        return updated_entity

    async def delete_legal_entity(self, legal_entity_id: UUID) -> None:
        """Удаляет юридическое лицо, если нет связанных отделов."""
        departments_count = await self.le_repository.count_departments(legal_entity_id)
        if departments_count > 0:
            raise LegalEntityInUse(legal_entity_id, details=f"{departments_count} department(s) linked")
        deleted_count = await self.le_repository.delete_legal_entity(legal_entity_id)
        if not deleted_count:
            raise LegalEntityNotFound(legal_entity_id)
