from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.user import UserAlreadyExists
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse
from app.schemas.user import UserLoginRequest, UserRegisterRequest
from app.utils.password import get_password_hash, verify_password
from app.utils.tokens import create_access_token, create_refresh_token, decode_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repository = UserRepository(db)

    async def register_user(self, data: UserRegisterRequest) -> AuthResponse:
        """Обрабатывает регистрацию нового пользователя."""
        email = str(data.email)
        if await self.user_repository.get_by_email(email):
            raise UserAlreadyExists(email)

        password_hash = get_password_hash(data.password)
        new_user = await self.user_repository.create_user(data, password_hash)

        return self._generate_auth_response(new_user)

    async def login_user(self, data: UserLoginRequest) -> AuthResponse:
        """Обрабатывает аутентификацию пользователя."""
        user = await self.user_repository.get_by_email(str(data.email))

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль"
            )

        return self._generate_auth_response(user)

    async def refresh_tokens(self, refresh_token: str) -> AuthResponse:
        """Обновляет access токен c помощью refresh"""
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ожидался refresh токен"
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Токен не содержит информации о пользователе"
            )

        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Токен содержит неверный формат идентификатора пользователя"
            )

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Пользователь не найден"
            )

        return self._generate_auth_response(user)

    def _generate_auth_response(self, user) -> AuthResponse:
        """Вспомогательный метод для генерации токенов и объекта ответа."""
        access_token = create_access_token(user)
        refresh_token = create_refresh_token(user)

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=user.id,
            role=user.role
        )
