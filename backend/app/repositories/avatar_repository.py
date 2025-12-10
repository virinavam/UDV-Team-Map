from uuid import UUID

from sqlalchemy import select
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

    async def set_current_avatar(self, user: User, avatar: Avatar | None):
        old_current_avatar = user.current_avatar
        if old_current_avatar:
            old_current_avatar.moderation_status = AvatarModerationStatusEnum.ACCEPTED
        if avatar:
            avatar.moderation_status = AvatarModerationStatusEnum.ACTIVE
            user.current_avatar_id = avatar.id
        else:
            user.current_avatar_id = None
        await self.db.commit()

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
            .order_by(Avatar.updated_at)
            .where(Avatar.moderation_status == AvatarModerationStatusEnum.PENDING)
            .options(selectinload(Avatar.user))
        )
        return result.scalars().all()
