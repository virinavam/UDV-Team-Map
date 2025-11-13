from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.models import Department
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, db: AsyncSession):
        self.department_repo = DepartmentRepository(db)
        self.user_repo = UserRepository(db)

    async def _check_parent(self, parent_id: UUID):
        parent_department = await self.department_repo.get_by_id(parent_id)
        if not parent_department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Родительский отдел не найден."
            )
        return parent_department

    async def create_department(self, create_data: DepartmentCreate) -> Department:
        """Создает новое юридическое лицо"""
        if create_data.parent_id:
            parent_department = await self._check_parent(create_data.parent_id)
            if parent_department.legal_entity_id != create_data.legal_entity_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Юридическое лицо родительского отдела не совпадает с юридическим лицом создаваемого отдела. ({} != {})"
                    .format(parent_department.legal_entity_id, create_data.legal_entity_id)
                )
        new_department = await self.department_repo.create_department(create_data)
        return new_department

    async def get_department(self, department_id: UUID) -> Department:
        """Получает департамент по ID."""
        department = await self.department_repo.get_by_id(department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Департамент не найден."
            )
        return department

    async def get_all_departments(self) -> Sequence[Department]:
        """Получает список всех департаментов."""
        departments = await self.department_repo.get_all_departments()
        return departments

    async def update_department(self, department_id: UUID, updates: DepartmentUpdate) -> Department:
        """Обновляет данные департамента."""
        update_data = updates.model_dump(exclude_unset=True)
        department = await self.department_repo.get_by_id(department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Департамент не найден."
            )

        if 'parent_id' in update_data and updates.parent_id is not None:
            await self._check_parent(update_data['parent_id'])
            is_loop = await self.department_repo.is_descendant(
                child_id=update_data['parent_id'],
                parent_id=department_id
            )
            if is_loop:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Невозможно установить родительский отдел, так как это создаст циклическую зависимость."
                )
        if 'manager_id' in update_data and updates.manager_id is not None:
            manager = await self.user_repo.get_by_id(updates.manager_id)
            if not manager:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Пользователь с ID {updates.manager_id} не найден."
                )
            if manager.managed_department:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Пользователь с ID {updates.manager_id} уже является менеджером отдела с ID {manager.managed_department.id}."
                )
        if updates.parent_id:
            parent_department = await self._check_parent(updates.parent_id)
            if parent_department.legal_entity_id != department.legal_entity_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Юридическое лицо родительского отдела не совпадает с юридическим лицом создаваемого отдела. ({} != {})"
                    .format(parent_department.legal_entity_id, department.legal_entity_id)
                )
        updated_department = await self.department_repo.update_department(department_id, update_data)
        if not updated_department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Департамент не найден."
            )
        return updated_department

    async def delete_department(self, department_id: UUID):
        """Удаляет департамент, проверяя бизнес-правило: отсутствие подотделов."""
        subdepartments_count = await self.department_repo.count_subdepartments(department_id)
        count_users = await self.department_repo.count_users(department_id)

        if count_users > 0 and subdepartments_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Невозможно удалить департамент с ID {department_id}, так как в нем есть {subdepartments_count} подотдел(а) и {count_users} пользователь(ей)."
            )
        if subdepartments_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Невозможно удалить департамент с ID {department_id}, так как в нем есть {subdepartments_count} подотдел(а)."
            )
        if count_users > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Невозможно удалить департамент с ID {department_id}, так как в нем есть {count_users} пользователь(ей)."
            )

        deleted_department = await self.department_repo.delete_department(department_id)

        if not deleted_department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Департамент не найден."
            )
