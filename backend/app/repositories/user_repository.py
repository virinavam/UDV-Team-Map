from typing import Sequence
from uuid import UUID

from sqlalchemy import select, update, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User
from app.schemas.user import UserRegisterRequest

from app.logger import get_logger

logger = get_logger()


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

    async def search_users_fuzzy(self, search_query: str, threshold: float = 0.1, limit: int = 10):
        search_query_lower = search_query.lower()

        sim_first = func.similarity(search_query_lower, func.lower(User.first_name))
        sim_last = func.similarity(search_query_lower, func.lower(User.last_name))
        sim_position = func.similarity(search_query_lower, func.lower(User.position))
        sim_email = func.similarity(search_query_lower, func.lower(User.email))

        similarity_score = func.greatest(sim_first, sim_last, sim_position, sim_email).label("score")

        stmt = (
            select(User, similarity_score)
            .where(
                or_(
                    sim_first > threshold,
                    sim_last > threshold,
                    sim_position > threshold,
                    sim_email > threshold
                )
            )
            .order_by(text("score DESC"))
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        rows = result.tuples().all()

        for user, score in rows:
            logger.info("User: %s, similarity: %.3f", user.email, score)

        return rows