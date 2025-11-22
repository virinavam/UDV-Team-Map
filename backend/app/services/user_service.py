from uuid import UUID

from sqlalchemy import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.skill import SkillNotFound
from app.exceptions.user import UserNotFound
from app.models import User
from app.repositories.skill_repository import SkillRepository
from app.repositories.user_repository import UserRepository
from app.schemas.skill import SetSkillsRequest
from app.schemas.user import UserUpdate
from app.core.logger import get_logger

logger = get_logger()


class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repository = UserRepository(db)
        self.skill_repository = SkillRepository(db)

    async def get_user(self, user_id: UUID) -> User:
        """Получает пользователя по UUID."""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise UserNotFound(user_id)
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
            raise UserNotFound(user_id)
        return user

    async def update_user(self, user_id: UUID, updates: UserUpdate) -> User:
        """
        Обновляет данные пользователя.
        Бизнес-логика: подготовка данных.
        """
        update_data = updates.model_dump(exclude_unset=True)

        if not update_data:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                raise UserNotFound(user_id)
            return user

        updated_user = await self.user_repository.update_user(
            user_id=user_id,
            update_data=update_data
        )
        return updated_user

    async def search_users(self, search_query: str, city: str | None = None, skills: list | None = None) -> Sequence[
        User]:
        """
        Выполняет нечеткий поиск по имени, фамилии, должности и email.
        args:
            search_query (str): Строка поиска.
            city (str): фильтр по городу
        returns:
            Sequence[User]: Список пользователей, соответствующих критериям поиска.
        """
        users = await self.user_repository.search_users_fuzzy(search_query=search_query, city=city, skills=skills)
        return users

    async def set_skills(self, user_id: UUID, payload: SetSkillsRequest) -> User:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise UserNotFound(user_id)
        skills_in_db = await self.skill_repository.get_skills_by_names(payload.skills)
        existing_names = {s.name.lower() for s in skills_in_db}
        unknown_skills = {s for s in payload.skills if s.lower() not in existing_names}
        if unknown_skills:
            raise SkillNotFound(list(unknown_skills))
        user = await self.user_repository.set_skills(user_id=user_id, skills=skills_in_db)
        return user
