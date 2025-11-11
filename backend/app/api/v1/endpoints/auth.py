from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.database import get_db
from app.logger import get_logger
from app.schemas.auth import AuthResponse
from app.schemas.user import UserLoginRequest, UserRegisterRequest
from app.services.auth_service import AuthService  # Импорт сервиса

auth_router = APIRouter()
logger = get_logger()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Зависимость, предоставляющая экземпляр AuthService."""
    return AuthService(db)


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


@auth_router.post("/refresh",
                  response_model=AuthResponse,
                  responses={
                      401: {
                          "description": "Ошибки авторизации",
                          "content": {
                              "application/json": {
                                  "examples": {
                                      "invalid_token_type": {
                                          "summary": "Неверный тип токена",
                                          "value": {"detail": "Ожидался refresh токен"},
                                      },
                                      "missing_subject": {
                                          "summary": "Отсутствует идентификатор пользователя",
                                          "value": {"detail": "Токен не содержит информации о пользователе"},
                                      },
                                      "user_not_found": {
                                          "summary": "Пользователь не существует",
                                          "value": {"detail": "Пользователь не найден"},
                                      }
                                  }
                              }
                          }
                      }
                  })
async def refresh(
        refresh_token: str,
        auth_service: AuthService = Depends(get_auth_service)
):
    """
    Обновляет access и refresh токены, если refresh токен валиден.
    Логика вынесена в AuthService.
    """
    return await auth_service.refresh_tokens(refresh_token)
