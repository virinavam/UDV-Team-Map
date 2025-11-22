from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException

from app.deps.user import get_user_service
from app.enums import RoleEnum
from app.exceptions.skill import SkillNotFound
from app.exceptions.user import UserNotFound
from app.core.logger import get_logger
from app.schemas.skill import SetSkillsRequest
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService
from app.utils.auth import require_roles

employees_router = APIRouter()
logger = get_logger()


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
    try:
        return await user_service.get_user(user_id)
    except UserNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@employees_router.patch("/{user_id}",
                        response_model=UserRead,
                        summary="Обновить данные сотрудника",
                        dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))])
async def update_employee(user_id: UUID,
                          updates: UserUpdate,
                          user_service: UserService = Depends(get_user_service)):
    """Обновляет данные сотрудника.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    try:
        return await user_service.update_user(user_id, updates)
    except UserNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@employees_router.put("/users/{user_id}/set_skills",
                      response_model=UserRead,
                      summary="Установить навыки сотруднику",
                      dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def add_skills_to_user(
        user_id: UUID,
        payload: SetSkillsRequest,
        user_service: UserService = Depends(get_user_service)
):
    try:
        user = await user_service.set_skills(user_id, payload)
        return user
    except (SkillNotFound, UserNotFound) as e:
        raise HTTPException(status_code=404, detail=str(e))


@employees_router.delete("/{user_id}",
                         response_model=UserRead,
                         summary="Деактивировать сотрудника",
                         dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))])
async def deactivate_employee(user_id: UUID,
                              user_service: UserService = Depends(get_user_service)):
    """Помечает сотрудника как неактивного.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    try:
        return await user_service.deactivate_user(user_id)
    except UserNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


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
        q: str = Query(...),
        city: Optional[str] = Query(None, description="Фильтр по городу"),
        skills: list[str] = Query(default=None),
        user_service: UserService = Depends(get_user_service)
):
    """
    Выполняет нечеткий поиск по имени, фамилии, должности и email.
    args:
        q (str): Строка поиска.
        city (Optional[str]): Название города для фильтрации.
    returns:
        Sequence[User]: Список пользователей, соответствующих критериям поиска.
    """
    return await user_service.search_users(search_query=q, city=city, skills=skills)
