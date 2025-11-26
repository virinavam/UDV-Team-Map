from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from sqlalchemy.orm import selectinload

from app.models.avatar import Avatar
from app.models.user import User
from app.enums import AvatarModerationStatusEnum
from app.core.logger import get_logger

logger = get_logger()


class AvatarRepository:
    """
    Репозиторий для выполнения низкоуровневых операций с моделями Avatar и User
    в контексте аватаров.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, avatar_id: UUID):
        result = await self.db.execute(select(Avatar).options(selectinload(Avatar.user), selectinload(Avatar.moderated_by)).where(Avatar.id == avatar_id))
        return result.scalar_one_or_none()

    async def create_avatar(self, user_id: UUID, s3_key: str, status: AvatarModerationStatusEnum,
                            moderated_by_id: UUID | None) -> Avatar:
        new_avatar = Avatar(
            user_id=user_id,
            s3_key=s3_key,
            moderation_status=status,
            moderated_by_id=moderated_by_id
        )
        self.db.add(new_avatar)
        await self.db.flush()
        await self.db.commit()
        return new_avatar

    async def set_current_avatar(self, user: User, avatar: Avatar):
        old_current_avatar = user.current_avatar
        if old_current_avatar:
            # logger.info(f"old_current_avatar: {old_current_avatar}")
            old_current_avatar.moderation_status = AvatarModerationStatusEnum.ACCEPTED
        user.current_avatar_id = avatar.id
        await self.db.commit()
