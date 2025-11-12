from typing import Sequence
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User
from app.schemas.user import UserRegisterRequest


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        """Получает пользователя по email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        """Получает пользователя по UUID."""
        result = await self.db.execute(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.managed_department)
            )
        )
        return result.scalar_one_or_none()

    async def create_user(self, data: UserRegisterRequest, password_hash: str) -> User:
        """Создает и сохраняет нового пользователя в БД."""
        new_user = User(
            first_name=data.first_name,
            last_name=data.last_name,
            email=str(data.email),
            password_hash=password_hash
        )
        self.db.add(new_user)
        await self.db.commit()
        return new_user

    async def get_all_users(self) -> Sequence[User]:
        """Получает список всех пользователей."""
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def get_all_active_users(self) -> Sequence[User]:
        """Получает список всех активных пользователей."""
        result = await self.db.execute(select(User).where(User.is_active == True))
        return result.scalars().all()

    async def update_user(self, user_id: UUID, update_data: dict) -> User | None:
        """Обновляет данные пользователя в БД, используя прямой UPDATE."""
        if not update_data:
            return await self.get_by_id(user_id)

        user = await self.get_by_id(user_id)

        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**update_data)
            .returning(User)
        )

        await self.db.execute(stmt)
        await self.db.commit()
        await self.db.refresh(user)

        return await self.get_by_id(user_id)

    async def delete_user(self, user_id: UUID) -> User | None:
        """Пометить пользователя как неактивного."""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(is_active=False)
            .returning(User)
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        user = result.scalar_one_or_none()
        return user
