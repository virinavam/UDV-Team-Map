from io import BytesIO
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from starlette.responses import StreamingResponse

from app.core.logger import get_logger
from app.deps.avatar import get_avatar_service
from app.deps.user import get_user_service
from app.enums import RoleEnum, AvatarModerationStatusEnum
from app.models import User
from app.schemas.skill import SetSkillsRequest
from app.schemas.user import UserRead, UserUpdate, UserUpdateAdmin
from app.services.avatar_service import AvatarService
from app.services.user_service import UserService
from app.utils.auth import require_roles, require_self, get_current_user_by_credentials

employees_router = APIRouter()
logger = get_logger()


@employees_router.get(
    "/",
    response_model=list[UserRead],
    summary="Получить всех сотрудников",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_employees(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_all_users()


@employees_router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Получить сотрудника по ID",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_employee(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    """Получает сотрудника по его UUID."""
    return await user_service.get_user(user_id)


@employees_router.put(
    "/{user_id}",
    response_model=UserRead,
    summary="Обновить данные сотрудника (админ)",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def update_employee(user_id: UUID, updates: UserUpdateAdmin,
                          user_service: UserService = Depends(get_user_service)):
    """Обновляет данные сотрудника.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await user_service.update_user(user_id, updates)


@employees_router.put("/{user_id}/self", response_model=UserRead, summary="Обновить свои данные",
                      dependencies=[Depends(require_self(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def update_employee(user_id: UUID, updates: UserUpdate, user_service: UserService = Depends(get_user_service)):
    """Обновляет свои данные."""
    return await user_service.update_user(user_id, updates)


ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
]


@employees_router.post("/{user_id}/avatar/upload", status_code=200,
                       summary="Загрузить новую фотографию профиля",
                       dependencies=[Depends(require_self(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def upload_user_avatar(
        user_id: UUID,
        file: UploadFile = File(...),
        no_moderation: bool = Query(False,
                                    description="Если True, аватар становится активным сразу, минуя модерацию. Требует прав модератора."),
        current_user: User = Depends(get_current_user_by_credentials),
        avatar_service: AvatarService = Depends(get_avatar_service),
        user_service: UserService = Depends(get_user_service)):
    """
    Supported file types: JPG/JPEG, PNG, WEBP, GIF, HEIC/HEIF
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        allowed_extensions = "JPG/JPEG, PNG, WEBP, GIF, HEIC/HEIF"
        raise HTTPException(
            status_code=415,
            detail=f"File type not supported. Expected: {allowed_extensions}"
        )
    initial_status = AvatarModerationStatusEnum.PENDING
    moderator_id = None

    if no_moderation:
        if current_user.role in [RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN]:
            initial_status = AvatarModerationStatusEnum.ACTIVE
            moderator_id = current_user.id
        else:
            raise HTTPException(
                status_code=403,
                detail="Для флага 'no_moderation' требуются права HR_ADMIN или SYSTEM_ADMIN."
            )
    user = await user_service.get_user(user_id)
    await avatar_service.upload_and_activate(user, file, initial_status, moderator_id)
    return


@employees_router.get("/avatars/{s3_key:path}", response_class=StreamingResponse, summary="Возвращает аватар по ключу",
                      dependencies=[
                          Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def get_s3_file(s3_key: str, avatar_service: AvatarService = Depends(get_avatar_service)):
    file_buffer = BytesIO()

    await avatar_service.download(s3_key, file_buffer)
    file_buffer.seek(0)

    return StreamingResponse(
        content=file_buffer,
        media_type="image/jpeg",
    )


@employees_router.put("/avatars/{avatar_id}/moderate", dependencies=[
    Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def get_moderate_avatar(avatar_id: UUID, avatar_service: AvatarService = Depends(get_user_service),
                              current_user: User = Depends(get_current_user_by_credentials)):
    pass


@employees_router.put(
    "/{user_id}/set_skills",
    response_model=UserRead,
    summary="Установить навыки сотруднику",
    dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def add_skills_to_user(
        user_id: UUID, payload: SetSkillsRequest, user_service: UserService = Depends(get_user_service)
):
    return await user_service.set_skills(user_id, payload)


@employees_router.delete(
    "/{user_id}",
    response_model=UserRead,
    summary="Деактивировать сотрудника",
    dependencies=[Depends(require_roles(RoleEnum.SYSTEM_ADMIN, RoleEnum.HR_ADMIN))],
)
async def deactivate_employee(user_id: UUID, user_service: UserService = Depends(get_user_service)):
    """Помечает сотрудника как неактивного.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await user_service.deactivate_user(user_id)


@employees_router.get("/active/", response_model=list[UserRead], summary="Получить всех активных сотрудников")
async def read_active_employees(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_all_active_users()


@employees_router.get("/search/", response_model=list[UserRead],
                      summary="Поиск сотрудников по имени, фамилии, должности или email")
async def search_employees(
        q: str = Query(...),
        city: Optional[str] = Query(None, description="Фильтр по городу"),
        skills: list[str] = Query(default=None),
        user_service: UserService = Depends(get_user_service),
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
