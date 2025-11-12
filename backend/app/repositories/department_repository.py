from uuid import UUID

from sqlalchemy import select, Sequence, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Department, User
from app.schemas.department import DepartmentCreate


class DepartmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, department_id: UUID) -> Department | None:
        """Получает департамент по ID."""
        result = await self.db.execute(
            select(Department)
            .where(Department.id == department_id)
            .options(
                selectinload(Department.manager),
                selectinload(Department.employees),
                selectinload(Department.subdepartments).selectinload(Department.manager),
                selectinload(Department.subdepartments).selectinload(Department.employees),
            )
        )
        return result.scalar_one_or_none()

    async def get_all_departments(self) -> Sequence[Department]:
        """Получает список всех департаментов."""
        result = await self.db.execute(
            select(Department)
            .options(
                selectinload(Department.manager),
                selectinload(Department.employees),
                selectinload(Department.subdepartments).selectinload(Department.manager),
                selectinload(Department.subdepartments).selectinload(Department.employees),
            )
        )
        return result.scalars().all()

    async def create_department(self, create_data: DepartmentCreate) -> Department:
        """Создает и сохраняет новый департамент в БД."""
        new_department = Department(**create_data.model_dump())
        self.db.add(new_department)
        await self.db.commit()
        await self.db.refresh(new_department)
        return await self.get_by_id(new_department.id)

    async def update_department(self, departament_id: UUID, update_data: dict) -> Department | None:
        """Обновляет данные департамента в БД."""
        if update_data:
            stmt = (
                update(Department)
                .where(Department.id == departament_id)
                .values(**update_data)
                .returning(Department)
            )
            await self.db.execute(stmt)
            await self.db.commit()

        return await self.get_by_id(departament_id)

    async def count_subdepartments(self, departament_id: UUID) -> int:
        """Подсчитывает количество подотделов"""
        stmt = select(func.count(Department.id)).where(
            Department.parent_id == departament_id
        )
        return await self.db.scalar(stmt)

    async def count_users(self, department_id: UUID) -> int:
        """Подсчитывает количество пользователей в департаменте"""
        stmt = select(func.count(User.id).where(
            User.department_id == department_id)
        )
        return await self.db.scalar(stmt)

    async def is_descendant(self, child_id: UUID, parent_id: UUID) -> bool:
        """
        Проверяет, является ли child_id потомком (прямым или косвенным)
        родительского департамента parent_id с использованием ORM CTE.
        """

        if child_id == parent_id:
            return True

        DepartmentTable = Department.__table__

        anchor = (
            select(DepartmentTable.c.id, DepartmentTable.c.parent_id)
            .where(DepartmentTable.c.id == parent_id)
            .cte(name="department_tree", recursive=True)
        )

        recursive_term = (
            select(DepartmentTable.c.id, DepartmentTable.c.parent_id)
            .join(anchor, DepartmentTable.c.parent_id == anchor.c.id)
        )

        department_cte = anchor.union_all(recursive_term)

        query = select(department_cte.c.id).where(department_cte.c.id == child_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def delete_department(self, department_id: UUID) -> bool:
        """Удаляет департамент по ID (без проверки зависимостей!)."""
        stmt = delete(Department).where(Department.id == department_id)
        result = await self.db.execute(stmt)
        await self.db.commit()

        # Возвращаем True, если что-то было удалено
        return result.rowcount > 0
