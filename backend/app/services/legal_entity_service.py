from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.models import LegalEntity
from app.repositories.legal_entity_repository import LegalEntityRepository
from app.schemas.legal_entity import LegalEntityUpdate


class LegalEntityService:
    def __init__(self, db: AsyncSession):
        self.le_repository = LegalEntityRepository(db)

    async def get_legal_entity(self, legal_entity_id: UUID) -> LegalEntity:
        """Получает юридическое лицо по UUID."""
        legal_entity = await self.le_repository.get_by_id(legal_entity_id)
        if not legal_entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Юридическое лицо с ID {legal_entity_id} не найдено."
            )
        return legal_entity

    async def get_all_legal_entities(self) -> Sequence[LegalEntity]:
        """Получает список всех юридических лиц."""
        legal_entities = await self.le_repository.get_all_legal_entities()
        return legal_entities

    async def create_legal_entity(self, name: str) -> LegalEntity:
        """Создает новое юридическое лицо."""
        new_legal_entity = await self.le_repository.create_legal_entity(name)
        return new_legal_entity

    async def update_legal_entity(self, legal_entity_id: UUID, updates: LegalEntityUpdate) -> LegalEntity:
        """Обновляет данные юридического лица."""
        update_data = updates.model_dump(exclude_unset=True)
        updated_legal_entity = await self.le_repository.update_legal_entity(legal_entity_id, update_data)
        if not updated_legal_entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Юридическое лицо с ID {legal_entity_id} не найдено."
            )
        return updated_legal_entity

    async def delete_legal_entity(self, legal_entity_id: UUID) -> None:
        """
        Удаляет юрлицо, проверяя бизнес-правило: отсутствие связанных отделов.
        """
        departments_count = await self.le_repository.count_departments(legal_entity_id)

        if departments_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Невозможно удалить юридическое лицо с ID {legal_entity_id}, так как с ним связано {departments_count} отдел(а)."
            )

        deleted_count = await self.le_repository.delete_legal_entity(legal_entity_id)

        if not deleted_count:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Юридическое лицо с ID {legal_entity_id} не найдено."
            )
