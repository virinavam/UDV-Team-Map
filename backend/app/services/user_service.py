from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate



class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repository = UserRepository(db)

    async def get_user(self, user_id: UUID) -> User:
        """Получает пользователя по UUID."""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        return user

    async def get_all_users(self) -> Sequence[User]:
        """Получает список всех пользователей."""
        return await self.user_repository.get_all_users()

    async def get_all_active_users(self) -> Sequence[User]:
        """Получает список всех активных пользователей."""
        return await self.user_repository.get_all_active_users()

    async def deactivate_user(self, user_id: UUID) -> User:
        """Помечает пользователя как неактивного."""
        user = await self.user_repository.delete_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        return user

    async def update_user(self, user_id: UUID, updates: UserUpdate) -> User:
        """
        Обновляет данные пользователя.
        Бизнес-логика: подготовка данных.
        """
        # 1. Бизнес-логика: Подготовка данных для Репозитория
        # model_dump(exclude_none=True) гарантирует, что мы передадим только те поля,
        # которые реально нужно изменить.
        update_data = updates.model_dump(exclude_unset=True)

        if not update_data:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
            return user

        updated_user = await self.user_repository.update_user(
            user_id=user_id,
            update_data=update_data
        )


        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        return updated_user
