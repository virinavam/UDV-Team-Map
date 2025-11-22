from uuid import UUID
from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.department import (InvalidParentDepartment, DepartmentNotFound, DepartmentConflict,
                                       ManagerConflict, DepartmentDeleteError)
from app.exceptions.user import UserNotFound
from app.models import Department
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, db: AsyncSession):
        self.department_repo = DepartmentRepository(db)
        self.user_repo = UserRepository(db)

    async def _check_parent_valid(self, parent_id: UUID, legal_entity_id: UUID, current_department_id: UUID = None):
        parent_department = await self.department_repo.get_by_id(parent_id)
        if not parent_department:
            raise DepartmentNotFound(parent_id)
        if parent_department.legal_entity_id != legal_entity_id:
            raise InvalidParentDepartment(
                parent_id,
                f"Parent legal entity ({parent_department.legal_entity_id}) "
                f"does not match ({legal_entity_id})"
            )
        if current_department_id is not None:
            is_loop = await self.department_repo.is_descendant(
                child_id=parent_id,
                parent_id=current_department_id
            )
            if is_loop:
                raise DepartmentConflict("Setting this parent would create a cycle")

        return parent_department

    async def _check_manager(self, manager_id: UUID):
        manager = await self.user_repo.get_by_id(manager_id)
        if not manager:
            raise UserNotFound(manager_id)
        if manager.managed_department:
            raise ManagerConflict(manager_id, manager.managed_department.id)
        return manager

    async def create_department(self, create_data: DepartmentCreate) -> Department:
        if create_data.parent_id:
            await self._check_parent_valid(create_data.parent_id, create_data.legal_entity_id)
        new_department = await self.department_repo.create_department(create_data)
        return new_department

    async def get_department(self, department_id: UUID) -> Department:
        department = await self.department_repo.get_by_id(department_id)
        if not department:
            raise DepartmentNotFound(department_id)
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
            raise DepartmentNotFound(department_id)

        if 'parent_id' in update_data and updates.parent_id is not None:
            await self._check_parent_valid(
                parent_id=update_data['parent_id'],
                legal_entity_id=department.legal_entity_id,
                current_department_id=department_id
            )

        if 'manager_id' in update_data and updates.manager_id is not None:
            await self._check_manager(updates.manager_id)

        updated_department = await self.department_repo.update_department(department_id, update_data)
        if not updated_department:
            raise DepartmentNotFound(department_id)

        return updated_department

    async def delete_department(self, department_id: UUID):
        """Удаляет департамент, проверяя бизнес-правило: отсутствие подотделов."""
        department = await self.department_repo.get_by_id(department_id)
        if not department:
            raise DepartmentNotFound(department_id)

        subdepartments_count = await self.department_repo.count_subdepartments(department_id)
        count_users = await self.department_repo.count_users(department_id)

        if subdepartments_count > 0 or count_users > 0:
            raise DepartmentDeleteError(department_id, subdepartments_count, count_users)

        await self.department_repo.delete_department(department_id)
