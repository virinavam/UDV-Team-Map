from uuid import UUID

from sqlalchemy import select, Sequence, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import LegalEntity, Department


class LegalEntityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, legal_entity_id: UUID) -> LegalEntity | None:
        """Получает юридическое лицо по ID."""
        result = await self.db.execute(
            select(LegalEntity)
            .where(LegalEntity.id == legal_entity_id)
            .options(
                selectinload(LegalEntity.departments)
                .selectinload(Department.employees)
            )
        )
        return result.scalar_one_or_none()

    async def get_all_legal_entities(self) -> Sequence[LegalEntity]:
        """Получает список всех юридических лиц."""
        result = await self.db.execute(
            select(LegalEntity)
            .options(
                selectinload(LegalEntity.departments)
                .selectinload(Department.employees)
            )
        )
        return result.scalars().all()

    async def create_legal_entity(self, name: str) -> LegalEntity:
        """Создает и сохраняет новое юридическое лицо в БД."""
        new_entity = LegalEntity(name=name)
        self.db.add(new_entity)
        await self.db.commit()
        await self.db.refresh(new_entity)
        return await self.get_by_id(new_entity.id)

    async def update_legal_entity(self, legal_entity_id: UUID, update_data: dict) -> LegalEntity | None:
        """Обновляет данные юридического лица в БД."""
        if update_data:
            stmt = (
                update(LegalEntity)
                .where(LegalEntity.id == legal_entity_id)
                .values(**update_data)
                .returning(LegalEntity)
            )

            await self.db.execute(stmt)
            await self.db.commit()

        return await self.get_by_id(legal_entity_id)

    async def count_departments(self, legal_entity_id: UUID) -> int:
        """Подсчитывает количество отделов, связанных с юрлицом."""
        # Используем прямой SQL-запрос для эффективности
        stmt = select(func.count(Department.id)).where(
            Department.legal_entity_id == legal_entity_id
        )
        # scalar_one возвращает одно значение (результат функции count)
        return await self.db.scalar(stmt)

    async def delete_legal_entity(self, legal_entity_id: UUID) -> bool:
        """Удаляет юрлицо по ID (без проверки зависимостей!)."""
        stmt = delete(LegalEntity).where(LegalEntity.id == legal_entity_id)
        result = await self.db.execute(stmt)
        await self.db.commit()

        # Возвращаем True, если что-то было удалено
        return result.rowcount > 0
