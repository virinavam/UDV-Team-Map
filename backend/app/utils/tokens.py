import jwt
from datetime import timedelta, datetime, timezone

from fastapi import HTTPException
from jwt import ExpiredSignatureError, PyJWTError
from starlette import status

from app.core.config import settings


def create_access_token(email: str) -> str:
    """
    Создаёт токен доступа с заданным сроком действия.
    :param email: Адрес электронной почты пользователя
    :return: JWT-токен
    """
    expires_delta = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": email, "exp": datetime.now(timezone.utc) + expires_delta, "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(email: str) -> str:
    """
    Создаёт токен обновления с заданным сроком действия.
    :param email: Адрес электронной почты пользователя
    :return: JWT-токен
    """
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": email, "exp": datetime.now(timezone.utc) + expires_delta, "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Декодирует JWT-токен и возвращает его полезную нагрузку.
    :param token: JWT-токен
    :return: полезная нагрузка токена
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
