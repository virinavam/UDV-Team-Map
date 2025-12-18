from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logger import get_logger
from app.enums import AvatarModerationStatusEnum
from app.models.avatar import Avatar
from app.models.user import User

logger = get_logger()


class AvatarRepository:
    """
    Репозиторий для выполнения низкоуровневых операций с моделями Avatar и User
    в контексте аватаров.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, avatar_id: UUID) -> Avatar | None:
        result = await self.db.execute(
            select(Avatar)
            .options(selectinload(Avatar.user), selectinload(Avatar.moderated_by))
            .where(Avatar.id == avatar_id)
        )
        return result.scalar_one_or_none()

    async def create_avatar(
        self, user_id: UUID, s3_key: str, status: AvatarModerationStatusEnum, moderated_by_id: UUID | None
    ) -> Avatar:
        new_avatar = Avatar(user_id=user_id, s3_key=s3_key, moderation_status=status, moderated_by_id=moderated_by_id)
        self.db.add(new_avatar)
        await self.db.flush()
        await self.db.commit()
        return new_avatar

    async def create_avatar_without_commit(
        self, user_id: UUID, s3_key: str, status: AvatarModerationStatusEnum, moderated_by_id: UUID | None
    ) -> Avatar:
        """
        Создает аватар и выполняет flush, но не commit.
        Используется для избежания циклических зависимостей при установке current_avatar_id.
        Создает аватар БЕЗ moderated_by_id, чтобы избежать циклической зависимости.
        moderated_by_id должен быть установлен отдельно после установки current_avatar_id.
        """
        # Создаем аватар БЕЗ moderated_by_id, чтобы избежать циклической зависимости
        new_avatar = Avatar(user_id=user_id, s3_key=s3_key, moderation_status=status, moderated_by_id=None)
        self.db.add(new_avatar)
        await self.db.flush()
        return new_avatar

    async def set_moderated_by_id(self, avatar: Avatar, moderated_by_id: UUID | None):
        """
        Устанавливает moderated_by_id для аватара через прямой SQL update.
        Должно вызываться после установки current_avatar_id, чтобы избежать циклических зависимостей.
        Использует прямой SQL update, чтобы избежать обратных связей ORM.
        """
        if moderated_by_id:
            await self.db.execute(
                update(Avatar)
                .where(Avatar.id == avatar.id)
                .values(moderated_by_id=moderated_by_id)
            )
            # НЕ обновляем объект в памяти, чтобы избежать обратных связей ORM
            # Состояние будет синхронизировано после commit

    async def set_current_avatar(self, user: User, avatar: Avatar | None):
        # Загружаем текущий аватар, если он есть
        if user.current_avatar_id:
            old_current_avatar = await self.get_by_id(user.current_avatar_id)
            if old_current_avatar:
                old_current_avatar.moderation_status = AvatarModerationStatusEnum.ACCEPTED
        if avatar:
            avatar.moderation_status = AvatarModerationStatusEnum.ACTIVE
            user.current_avatar_id = avatar.id
        else:
            user.current_avatar_id = None
        await self.db.commit()
        # Обновляем объект пользователя в сессии, чтобы изменения были видны
        await self.db.refresh(user)

    async def set_current_avatar_without_commit(self, user: User, avatar: Avatar | None):
        """
        Устанавливает текущий аватар без commit.
        Используется для избежания циклических зависимостей.
        Использует прямой SQL update для установки current_avatar_id и moderation_status, чтобы избежать обратных связей ORM.
        """
        # Загружаем текущий аватар, если он есть, но избегаем selectinload чтобы не создавать лишние связи
        if user.current_avatar_id:
            # Используем прямой SQL update для установки статуса старого аватара
            await self.db.execute(
                update(Avatar)
                .where(Avatar.id == user.current_avatar_id)
                .values(moderation_status=AvatarModerationStatusEnum.ACCEPTED)
            )
        
        if avatar:
            # Используем прямой SQL update для установки статуса нового аватара
            await self.db.execute(
                update(Avatar)
                .where(Avatar.id == avatar.id)
                .values(moderation_status=AvatarModerationStatusEnum.ACTIVE)
            )
            # Используем прямой SQL update для установки current_avatar_id, чтобы избежать обратных связей
            await self.db.execute(
                update(User)
                .where(User.id == user.id)
                .values(current_avatar_id=avatar.id)
            )
            # НЕ обновляем объекты в памяти, чтобы избежать обратных связей ORM
            # Состояние будет синхронизировано после commit
        else:
            await self.db.execute(
                update(User)
                .where(User.id == user.id)
                .values(current_avatar_id=None)
            )
            # НЕ обновляем объект в памяти, чтобы избежать обратных связей ORM
        # Не делаем commit здесь - он будет выполнен после

    async def get_previous_avatar(self, user: User) -> Avatar:
        result = await self.db.execute(
            select(Avatar)
            .where(Avatar.user_id == user.id, Avatar.moderation_status == AvatarModerationStatusEnum.ACCEPTED)
            .order_by(Avatar.updated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def set_avatar_status(
        self, avatar: Avatar, status: AvatarModerationStatusEnum, moderator: User, rejection_reason: str = None
    ):
        avatar.moderated_by_id = moderator.id
        avatar.moderation_status = status
        if status == AvatarModerationStatusEnum.REJECTED:
            avatar.rejection_reason = rejection_reason
        elif status == AvatarModerationStatusEnum.ACCEPTED:
            await self.set_current_avatar(avatar.user, avatar)
        await self.db.commit()

    async def delete_avatar(self, avatar: Avatar):
        avatar.moderation_status = AvatarModerationStatusEnum.DELETED
        await self.db.commit()

    async def get_pending_list(self):
        result = await self.db.execute(
            select(Avatar)
            .order_by(Avatar.updated_at.desc())
            .where(Avatar.moderation_status == AvatarModerationStatusEnum.PENDING)
            .options(selectinload(Avatar.user))
        )
        return result.scalars().all()

    async def get_accepted_list(self):
        result = await self.db.execute(
            select(Avatar)
            .order_by(Avatar.updated_at.desc())
            .where(Avatar.moderation_status == AvatarModerationStatusEnum.ACCEPTED)
            .options(selectinload(Avatar.user))
        )
        return result.scalars().all()

    async def get_rejected_list(self):
        result = await self.db.execute(
            select(Avatar)
            .order_by(Avatar.updated_at.desc())
            .where(Avatar.moderation_status == AvatarModerationStatusEnum.REJECTED)
            .options(selectinload(Avatar.user))
        )
        return result.scalars().all()
