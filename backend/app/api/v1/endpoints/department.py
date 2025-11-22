from uuid import UUID

from fastapi import APIRouter, Depends
from starlette import status

from app.core.logger import get_logger
from app.deps.department import get_department_service
from app.enums import RoleEnum
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentReadSmall, DepartmentUpdate
from app.services.department_service import DepartmentService
from app.utils.auth import require_roles

department_router = APIRouter()
logger = get_logger()


@department_router.get(
    "/",
    response_model=list[DepartmentReadSmall],
    summary="Получить все отделы",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_departments(dep_service: DepartmentService = Depends(get_department_service)):
    """Получает список всех отделов."""
    return await dep_service.get_all_departments()


@department_router.post(
    "/",
    response_model=DepartmentReadSmall,
    summary="Создать новый отдел",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def create_department(data: DepartmentCreate, dep_service: DepartmentService = Depends(get_department_service)):
    """Создает новый отдел.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await dep_service.create_department(data)


@department_router.get(
    "/{department_id}",
    response_model=DepartmentRead,
    summary="Получить отдел по ID",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_department(department_id: UUID, dep_service: DepartmentService = Depends(get_department_service)):
    """Получает отдел по его UUID."""
    return await dep_service.get_department(department_id)


@department_router.patch(
    "/{department_id}",
    response_model=DepartmentRead,
    summary="Обновить данные отдела",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def update_department(
    department_id: UUID, updates: DepartmentUpdate, dep_service: DepartmentService = Depends(get_department_service)
):
    """Обновляет данные отдела.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await dep_service.update_department(department_id, updates)


@department_router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить отдел",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def delete_department(department_id: UUID, dep_service: DepartmentService = Depends(get_department_service)):
    """Удаляет отдел.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    await dep_service.delete_department(department_id)
    logger.info("Отдел с ID %s успешно удален.", department_id)
