from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.deps.db import get_db
from app.models import User
from app.repositories.user_repository import UserRepository
from app.utils.tokens import decode_token
from app.core.logger import get_logger

security = HTTPBearer()
logger = get_logger()


async def get_user_by_token(access_token: str, db: AsyncSession) -> User:
    payload = decode_token(access_token)
    user_repo = UserRepository(db)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ожидался access токен"
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

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )
    return user


async def get_current_user_by_credentials(credentials: HTTPAuthorizationCredentials = Depends(security),
                                          db: AsyncSession = Depends(get_db)) -> User:
    """
        Получает текущего пользователя из токена доступа.

        :param credentials: Объект, содержащий заголовки авторизации,
                            из которых извлекается токен.
        :param db: Асинхронная сессия базы данных.
        :return: Объект пользователя, найденный в базе данных.
        :raises HTTPException: Если токен не является валидным или
                                пользователь не найден в базе данных.
        """
    token = credentials.credentials
    return await get_user_by_token(token, db)


def require_roles(*roles):
    async def dependency(user: User = Depends(get_current_user_by_credentials)):
        # Преобразуем роли в строки для сравнения
        role_values = [role.value if hasattr(role, 'value') else str(role) for role in roles]
        # logger.info(f"roles: {role_values}")
        # logger.info(f"user: {user.role}")
        if user.role not in role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
        return user

    return dependency
