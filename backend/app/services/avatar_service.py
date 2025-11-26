from io import BytesIO
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from uuid import UUID

from app.core.config import settings
from app.services.s3_service import S3Service
from app.repositories.avatar_repository import AvatarRepository
from app.utils.file_keys import generate_key
from app.models.user import User
from app.enums import AvatarModerationStatusEnum


class AvatarService:
    """
    Сервис для обработки бизнес-логики, связанной с аватарами (S3 + DB).
    """

    def __init__(self, db: AsyncSession, s3_service: S3Service):
        self.avatar_repository = AvatarRepository(db)
        self.s3_service = s3_service

    async def upload_and_activate(self,
                                  target_user: User,
                                  file: UploadFile,
                                  initial_status: AvatarModerationStatusEnum,
                                  moderator_id: UUID | None):

        s3_key = generate_key(target_user.id, file.filename)
        self.s3_service.upload_file_obj(
            file_object=file.file,
            object_key=s3_key,
            bucket_name=settings.S3_USER_AVATAR_BUCKET,
        )

        new_avatar = await self.avatar_repository.create_avatar(
            user_id=target_user.id,
            s3_key=s3_key,
            status=initial_status,
            moderated_by_id=moderator_id
        )

        if initial_status == AvatarModerationStatusEnum.ACTIVE:
            await self.avatar_repository.set_current_avatar(target_user, new_avatar)
        else:
            await self.avatar_repository.db.commit()

    async def download(self, s3_key: str, file_object: BytesIO):
        self.s3_service.download_file_obj(file_object, settings.S3_USER_AVATAR_BUCKET, s3_key)
        file_object.seek(0)
