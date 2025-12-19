from io import BytesIO
from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.util import await_only
from starlette.responses import StreamingResponse
from watchfiles import awatch

from app.core.logger import get_logger
from app.deps.avatar import get_avatar_service
from app.deps.user import get_user_service
from app.enums import AvatarModerationStatusEnum, RoleEnum
from app.models import User
from app.schemas.avatar import AvatarModeration, AvatarRead
from app.schemas.skill import SetSkillsRequest
from app.schemas.user import UserRead, UserUpdate, UserUpdateAdmin
from app.services.avatar_service import AvatarService
from app.services.health_monitor import check_s3_health
from app.services.user_service import UserService
from app.utils.auth import get_current_user_by_credentials, require_roles, require_self

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


ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
]


@employees_router.post(
    "/{user_id}/avatar/upload",
    status_code=200,
    summary="Загрузить новую фотографию профиля",
    dependencies=[Depends(require_self(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def upload_user_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    no_moderation: bool = Query(
        False, description="Если True, аватар становится активным сразу, минуя модерацию. Требует прав модератора."
    ),
    current_user: User = Depends(get_current_user_by_credentials),
    avatar_service: AvatarService = Depends(get_avatar_service),
    user_service: UserService = Depends(get_user_service),
    _: None = Depends(check_s3_health),
):
    """
    Supported file types: JPG/JPEG, PNG, WEBP, GIF, HEIC/HEIF
    """
    try:
        if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
            allowed_extensions = "JPG/JPEG, PNG, WEBP, GIF, HEIC/HEIF"
            raise HTTPException(status_code=415, detail=f"File type not supported. Expected: {allowed_extensions}")

        initial_status = AvatarModerationStatusEnum.PENDING
        moderator_id = None

        if no_moderation:
            if current_user.role in [RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN]:
                initial_status = AvatarModerationStatusEnum.ACTIVE
                moderator_id = current_user.id
            else:
                raise HTTPException(
                    status_code=403, detail="Для флага 'no_moderation' требуются права HR_ADMIN или SYSTEM_ADMIN."
                )

        user = await user_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

        s3_key = await avatar_service.upload_and_activate(user, file, initial_status, moderator_id)
        return s3_key
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while uploading avatar: {str(e)}")


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
async def update_employee(
    user_id: UUID, updates: UserUpdateAdmin, user_service: UserService = Depends(get_user_service)
):
    """Обновляет данные сотрудника.
    Доступно только для SYSTEM_ADMIN и HR_ADMIN."""
    return await user_service.update_user(user_id, updates)


@employees_router.put(
    "/{user_id}/self",
    response_model=UserRead,
    summary="Обновить свои данные",
    dependencies=[Depends(require_self(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def update_employee_self(
    user_id: UUID, updates: UserUpdate, user_service: UserService = Depends(get_user_service)
):
    """Обновляет свои данные."""
    return await user_service.update_user(user_id, updates)


@employees_router.get(
    "/avatars/pending",
    status_code=200,
    summary="Получить список аватаров, ожидающих модерации",
    response_model=list[AvatarRead],
    dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def get_pending_avatars(avatar_service: AvatarService = Depends(get_avatar_service)):
    pending_avatars = await avatar_service.get_pending_list()
    return pending_avatars


@employees_router.get(
    "/avatars/accepted",
    status_code=200,
    summary="Получить список одобренных аватаров",
    response_model=list[AvatarRead],
    dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def get_accepted_avatars(avatar_service: AvatarService = Depends(get_avatar_service)):
    accepted_avatars = await avatar_service.get_accepted_list()
    return accepted_avatars


@employees_router.get(
    "/avatars/rejected",
    status_code=200,
    summary="Получить список отклоненных аватаров",
    response_model=list[AvatarRead],
    dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def get_rejected_avatars(avatar_service: AvatarService = Depends(get_avatar_service)):
    rejected_avatars = await avatar_service.get_rejected_list()
    return rejected_avatars


@employees_router.get(
    "/avatars/{s3_key:path}",
    response_class=StreamingResponse,
    summary="Возвращает аватар по ключу",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def get_s3_file(
    s3_key: str, avatar_service: AvatarService = Depends(get_avatar_service), _: None = Depends(check_s3_health)
):
    file_buffer = BytesIO()
    try:
        await avatar_service.download(s3_key, file_buffer)
        file_buffer.seek(0)

        return StreamingResponse(
            content=file_buffer,
            media_type="image/jpeg",
        )
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            raise HTTPException(status_code=404, detail=f"Avatar with key '{s3_key}' not found in S3.")


@employees_router.put(
    "/avatars/{avatar_id}/moderate",
    summary="Moderate Avatar",
    dependencies=[Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def moderate_avatar(
    avatar_id: UUID,
    payload: AvatarModeration,
    avatar_service: AvatarService = Depends(get_avatar_service),
    current_user: User = Depends(get_current_user_by_credentials),
):
    return await avatar_service.moderate(avatar_id, payload.status, current_user.id, payload.rejection_reason)


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


@employees_router.get(
    "/active/",
    response_model=list[UserRead],
    summary="Получить всех активных сотрудников",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_active_employees(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_all_active_users()


@employees_router.get(
    "/cities/",
    response_model=list[str],
    summary="Получить все города",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def read_cities(user_service: UserService = Depends(get_user_service)):
    return await user_service.get_cities()


@employees_router.get(
    "/search/",
    response_model=list[UserRead],
    summary="Поиск сотрудников по имени, фамилии, должности или email",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def search_employees(
    q: str = Query(...),
    cities: list[str] = Query(default=None),
    departments: list[UUID] = Query(default=None),
    legal_entities: list[UUID] = Query(default=None),
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
    return await user_service.search_users(
        search_query=q, cities=cities, skills=skills, departments=departments, legal_entities=legal_entities
    )
