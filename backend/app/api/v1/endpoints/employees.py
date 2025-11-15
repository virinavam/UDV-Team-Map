from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.enums import RoleEnum
from app.logger import get_logger
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService
from app.utils.auth import require_roles

employees_router = APIRouter()
logger = get_logger()


async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Зависимость, предоставляющая экземпляр UserService."""
    return UserService(db)


@employees_router.get("/",
                      response_model=list[UserRead],
                      summary="Получить всех сотрудников",
                      dependencies=[
                          Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def read_employees(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_all_users()


@employees_router.get("/{user_id}",
                      response_model=UserRead,
                      summary="Получить сотрудника по ID",
                      dependencies=[
                          Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def read_employee(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    """Получает сотрудника по его UUID."""
    return await user_service.get_user(user_id)


@employees_router.patch("/{user_id}",
                        response_model=UserRead,
                        summary="Обновить данные сотрудника",
                        dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))])
async def update_employee(user_id: UUID,
                          updates: UserUpdate,
                          user_service: UserService = Depends(get_user_service)):
    """Обновляет данные сотрудника.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await user_service.update_user(user_id, updates)


@employees_router.delete("/{user_id}",
                         response_model=UserRead,
                         summary="Деактивировать сотрудника",
                         dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))])
async def deactivate_employee(user_id: UUID,
                              user_service: UserService = Depends(get_user_service)):
    """Помечает сотрудника как неактивного.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await user_service.deactivate_user(user_id)


@employees_router.get("/active/",
                      response_model=list[UserRead],
                      summary="Получить всех активных сотрудников",
                      dependencies=[
                          Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def read_active_employees(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_all_active_users()


@employees_router.get("/search/",
                      response_model=list[UserRead],
                      summary="Поиск сотрудников по имени, фамилии, должности или email",
                      dependencies=[
                          Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def search_employees(
        q: str,
        limit: int = Query(5, ge=1, le=10, description="Максимальное количество возвращаемых сотрудников"),
        user_service: UserService = Depends(get_user_service)
):
    """
    Выполняет нечеткий поиск по имени, фамилии, должности и email.
    args:
        q (str): Строка поиска.
        limit (int): Максимальное количество возвращаемых пользователей (по умолчанию 10, максимум 10, минимум 1).
    returns:
        Sequence[User]: Список пользователей, соответствующих критериям поиска.
    """
    return await user_service.search_users(search_query=q, limit=limit)
