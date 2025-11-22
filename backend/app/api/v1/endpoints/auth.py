from fastapi import APIRouter, Depends
from app.core.logger import get_logger
from app.deps.auth import get_auth_service
from app.models import User
from app.schemas.auth import AuthResponse, RefreshRequest
from app.schemas.user import UserLoginRequest, UserRegisterRequest, UserRead
from app.services.auth_service import AuthService  # Импорт сервиса
from app.utils.auth import get_current_user_by_credentials

auth_router = APIRouter()
logger = get_logger()


@auth_router.post("/register", response_model=AuthResponse)
async def register(
        data: UserRegisterRequest,
        auth_service: AuthService = Depends(get_auth_service)
):
    """
    Регистрирует нового пользователя и возвращает токены.
    Логика вынесена в AuthService.
    """
    return await auth_service.register_user(data)


@auth_router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"description": "Неверный email или пароль"}},
)
async def login(
        data: UserLoginRequest,
        auth_service: AuthService = Depends(get_auth_service)
):
    """
    Аутентифицирует пользователя и возвращает токены.
    Логика вынесена в AuthService.
    """
    return await auth_service.login_user(data)


@auth_router.post("/refresh", response_model=AuthResponse)
async def refresh(
        body: RefreshRequest,
        auth_service: AuthService = Depends(get_auth_service)
):
    """
    Обновляет access токен, если refresh токен валиден.
    Логика вынесена в AuthService.
    """
    auth_response = await auth_service.refresh_tokens(body.refresh_token)
    auth_response.refresh_token = body.refresh_token
    return auth_response


@auth_router.get("/me", response_model=UserRead)
async def get_current_user(user: User = Depends(get_current_user_by_credentials)):
    """
    Получает информацию о текущем аутентифицированном пользователе.
    """
    return user
