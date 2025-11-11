from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.database import get_db
from app.logger import get_logger
from app.models.user import User
from app.schemas.auth import AuthResponse
from app.schemas.user import UserLoginRequest, UserRegisterRequest
from app.utils.password import verify_password, get_password_hash
from app.utils.tokens import create_access_token, create_refresh_token, decode_token

auth_router = APIRouter()
logger = get_logger()


@auth_router.post("/register", response_model=AuthResponse)
async def register(data: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await db.execute(select(User).where(User.email == data.email))
    user = user.scalar_one_or_none()

    if user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    new_user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=str(data.email),
        password_hash=get_password_hash(data.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(new_user)
    refresh_token = create_refresh_token(new_user)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=new_user.id,
        role=new_user.role
    )


@auth_router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"description": "Неверный email или пароль"}},
)
async def login(data: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.execute(select(User).where(User.email == data.email))
    user = user.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role
    )


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
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """
    Обновляет access и refresh токены, если refresh токен валиден.
    """
    payload = decode_token(refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ожидался refresh токен"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен не содержит информации о пользователе"
        )

    user_id = UUID(user_id)
    user = await db.execute(select(User).where(User.id == user_id))
    user = user.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )

    new_access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)

    return AuthResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
        role=user.role
    )
