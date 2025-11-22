from uuid import UUID

from fastapi import APIRouter, Depends
from starlette import status

from app.core.logger import get_logger
from app.deps.legal_entity import get_le_service
from app.enums import RoleEnum
from app.schemas.legal_entity import LegalEntityCreate, LegalEntityRead, LegalEntityUpdate
from app.services.legal_entity_service import LegalEntityService
from app.utils.auth import require_roles

le_router = APIRouter()
logger = get_logger()


@le_router.get(
    "/",
    response_model=list[LegalEntityRead],
    summary="Получить все юридические лица",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_legal_entities(le_service: LegalEntityService = Depends(get_le_service)):
    """Получает список всех юридических лиц."""
    return await le_service.get_all_legal_entities()


@le_router.post(
    "/",
    response_model=LegalEntityRead,
    summary="Создать новое юридическое лицо",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def create_legal_entity(data: LegalEntityCreate, le_service: LegalEntityService = Depends(get_le_service)):
    """Создает новое юридическое лицо.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await le_service.create_legal_entity(data.name)


@le_router.get(
    "/{le_id}",
    response_model=LegalEntityRead,
    summary="Получить юридическое лицо по ID",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_legal_entity(le_id: UUID, le_service: LegalEntityService = Depends(get_le_service)):
    """Получает юридическое лицо по его UUID."""
    return await le_service.get_legal_entity(le_id)


@le_router.patch(
    "/{le_id}",
    response_model=LegalEntityRead,
    summary="Обновить данные юридического лица",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def update_legal_entity(
    le_id: UUID, updates: LegalEntityUpdate, le_service: LegalEntityService = Depends(get_le_service)
):
    """Обновляет данные юридического лица.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await le_service.update_legal_entity(le_id, updates)


@le_router.delete(
    "/{le_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить юридическое лицо",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def delete_legal_entity(le_id: UUID, le_service: LegalEntityService = Depends(get_le_service)):
    """Удаляет юридическое лицо.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    await le_service.delete_legal_entity(le_id)
