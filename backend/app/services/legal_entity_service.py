from uuid import UUID

from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.legal_entity import LegalEntityNotFound, LegalEntityInUse, LegalEntityAlreadyExists
from app.models import LegalEntity
from app.repositories.legal_entity_repository import LegalEntityRepository
from app.schemas.legal_entity import LegalEntityUpdate


class LegalEntityService:
    def __init__(self, db: AsyncSession):
        self.le_repository = LegalEntityRepository(db)

    async def _check_unique_name(self, name: str, ignore_id: UUID | None = None):
        """Проверяет, что юрлицо с таким именем не существует."""
        existing = await self.le_repository.get_by_name(name)

        if existing and existing.id != ignore_id:
            raise LegalEntityAlreadyExists(f"Юридическое лицо с именем '{name}' уже существует.")

    async def get_legal_entity(self, legal_entity_id: UUID) -> LegalEntity:
        """Получает юридическое лицо по UUID."""
        legal_entity = await self.le_repository.get_by_id(legal_entity_id)
        if not legal_entity:
            raise LegalEntityNotFound(f"Юридическое лицо с ID {legal_entity_id} не найдено.")
        return legal_entity

    async def get_legal_entity_by_name(self, legal_entity_name: str) -> LegalEntity | None:
        legal_entity = await self.le_repository.get_by_name(legal_entity_name)
        return legal_entity

    async def get_all_legal_entities(self) -> Sequence[LegalEntity]:
        """Получает список всех юридических лиц."""
        legal_entities = await self.le_repository.get_all_legal_entities()
        return legal_entities

    async def create_legal_entity(self, name: str) -> LegalEntity:
        """Создает новое юридическое лицо."""
        await self._check_unique_name(name)
        new_legal_entity = await self.le_repository.create_legal_entity(name)
        return new_legal_entity

    async def update_legal_entity(self, legal_entity_id: UUID, updates: LegalEntityUpdate) -> LegalEntity:
        """Обновляет данные юридического лица."""
        update_data = updates.model_dump(exclude_unset=True)
        await self._check_unique_name(updates.name, ignore_id=legal_entity_id)
        updated_legal_entity = await self.le_repository.update_legal_entity(legal_entity_id, update_data)
        if not updated_legal_entity:
            raise LegalEntityNotFound(f"Юридическое лицо с ID {legal_entity_id} не найдено.")
        return updated_legal_entity

    async def delete_legal_entity(self, legal_entity_id: UUID) -> None:
        """
        Удаляет юрлицо, проверяя бизнес-правило: отсутствие связанных отделов.
        """
        departments_count = await self.le_repository.count_departments(legal_entity_id)

        if departments_count > 0:
            raise LegalEntityInUse(
                f"Невозможно удалить юридическое лицо с ID {legal_entity_id}, так как с ним связано {departments_count} отдел(а).")

        deleted_count = await self.le_repository.delete_legal_entity(legal_entity_id)

        if not deleted_count:
            raise LegalEntityNotFound(f"Юридическое лицо с ID {legal_entity_id} не найдено.")
