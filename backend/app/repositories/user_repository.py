from typing import Sequence
from uuid import UUID

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logger import get_logger
from app.models import User
from app.models.skill import Skill, user_skills_association
from app.schemas.user import UserRegisterRequest

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
            .options(selectinload(User.managed_department), selectinload(User.skills),
                     selectinload(User.current_avatar))
        )
        return result.scalar_one_or_none()

    async def create_user(self, data: UserRegisterRequest, password_hash: str) -> User:
        """Создает и сохраняет нового пользователя в БД."""
        new_user = User(
            first_name=data.first_name, last_name=data.last_name, email=str(data.email), password_hash=password_hash
        )
        self.db.add(new_user)
        await self.db.commit()
        return new_user

    async def get_all_users(self) -> Sequence[User]:
        """Получает список всех пользователей."""
        result = await self.db.execute(
            select(User).options(selectinload(User.managed_department), selectinload(User.skills),
                                 selectinload(User.current_avatar))
        )
        return result.scalars().all()

    async def get_all_active_users(self) -> Sequence[User]:
        """Получает список всех активных пользователей."""
        result = await self.db.execute(
            select(User).options(selectinload(User.managed_department), selectinload(User.skills),
                                 selectinload(User.current_avatar)).where(User.is_active is True))
        return result.scalars().all()

    async def update_user(self, user_id: UUID, update_data: dict) -> User | None:
        """Обновляет данные пользователя в БД, используя прямой UPDATE."""
        if not update_data:
            return await self.get_by_id(user_id)

        user = await self.get_by_id(user_id)

        stmt = update(User).where(User.id == user_id).values(**update_data).returning(User)

        await self.db.execute(stmt)
        await self.db.commit()
        await self.db.refresh(user)

        return await self.get_by_id(user_id)

    async def delete_user(self, user_id: UUID) -> User | None:
        """Пометить пользователя как неактивного."""
        stmt = update(User).where(User.id == user_id).values(is_active=False).returning(User)

        result = await self.db.execute(stmt)
        await self.db.commit()

        user = result.scalar_one_or_none()
        return user

    async def set_skills(self, user_id: UUID, skills: Sequence[Skill]) -> User | None:
        user = await self.get_by_id(user_id)
        user.skills = list(skills)
        await self.db.commit()
        return await self.get_by_id(user_id)

    async def search_users_fuzzy(
            self, search_query: str, city: str | None = None, skills: list | None = None
    ) -> Sequence[User]:
        search_query_lower = search_query.lower()

        # Объединённая строка, как в GIN TRGM индексе
        combined_field = func.lower(
            func.coalesce(User.first_name, "")
            + " "
            + func.coalesce(User.last_name, "")
            + " "
            + func.coalesce(User.position, "")
            + " "
            + func.coalesce(User.email, "")
        )

        similarity_score = func.similarity(combined_field, search_query_lower).label("score")

        stmt = select(User, similarity_score).order_by(text("score DESC"))

        if city:
            stmt = stmt.filter(func.lower(User.city) == city.lower())

        if skills:
            stmt = (
                stmt.join(user_skills_association, user_skills_association.c.user_id == User.id)
                .join(Skill, Skill.id == user_skills_association.c.skill_id)
                .filter(func.lower(Skill.name).in_([s.lower() for s in skills]))
                .group_by(User.id)
                .having(func.count(func.distinct(Skill.name)) == len(skills))
            )

        result = await self.db.execute(stmt)
        rows = result.tuples().all()

        logger.info("Fuzzy search results for query '%s':", search_query)
        for user, score in rows:
            logger.info("User: %s, similarity: %.3f", user.email, score)

        rows = [user for user, score in rows]
        return rows
