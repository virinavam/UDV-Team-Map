from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException
from jwt import ExpiredSignatureError, PyJWTError
from starlette import status

from app.core.config import settings
from app.core.logger import get_logger
from app.models.user import User

logger = get_logger()


def create_access_token(user: User) -> str:
    """
    Создаёт токен доступа с заданным сроком действия.
    :param user: Пользователь
    :return: JWT-токен
    """
    expires_delta = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": str(user.id), "exp": datetime.now(timezone.utc) + expires_delta, "type": "access"}
    logger.info(to_encode)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user: User) -> str:
    """
    Создаёт токен обновления с заданным сроком действия.
    :param user: Пользователь
    :return: JWT-токен
    """
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": str(user.id), "exp": datetime.now(timezone.utc) + expires_delta, "type": "refresh"}
    # logger.info(to_encode)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Декодирует JWT-токен и возвращает его полезную нагрузку.
    :param token: JWT-токен
    :return: полезная нагрузка токена
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=settings.ALGORITHM)
        # logger.info(payload)
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
