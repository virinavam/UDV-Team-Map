from io import BytesIO
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.enums import AvatarModerationStatusEnum as AMSEnum
from app.models.avatar import Avatar
from app.models.user import User
from app.repositories.avatar_repository import AvatarRepository
from app.services.s3_service import AsyncS3Service
from app.services.user_service import UserService
from app.utils.file_keys import generate_key


class AvatarService:
    """
    Сервис для обработки бизнес-логики, связанной с аватарами (S3 + DB).
    """

    def __init__(self, db: AsyncSession, s3_service: AsyncS3Service):
        self.avatar_repository = AvatarRepository(db)
        self.user_service = UserService(db)
        self.s3_service = s3_service

    async def upload_and_activate(
        self, target_user: User, file: UploadFile, initial_status: AMSEnum, moderator_id: UUID | None
    ) -> str:
        from app.core.logger import get_logger

        logger = get_logger()

        try:
            # Обрабатываем случай, когда filename может быть None
            filename = file.filename or "avatar.jpg"
            s3_key = generate_key(target_user.id, filename)

            logger.info(
                f"Uploading avatar for user {target_user.id}, s3_key: {s3_key}, content_type: {file.content_type}"
            )

            # Читаем содержимое файла в память, так как file.file может быть уже прочитан
            file_content = await file.read()
            file_buffer = BytesIO(file_content)

            # Устанавливаем content_type для S3
            file_buffer.content_type = file.content_type or "image/jpeg"

            logger.info(f"File read into memory, size: {len(file_content)} bytes")

            await self.s3_service.upload_file_obj(
                file_object=file_buffer,
                object_key=s3_key,
                bucket_name=settings.S3_USER_AVATAR_BUCKET,
            )

            logger.info("Avatar uploaded to S3, creating database record")

            new_avatar = await self.avatar_repository.create_avatar(
                user_id=target_user.id, s3_key=s3_key, status=initial_status, moderated_by_id=moderator_id
            )

            if initial_status == AMSEnum.ACTIVE:
                logger.info(f"Setting avatar as active for user {target_user.id}")
                await self.avatar_repository.set_current_avatar(target_user, new_avatar)
            else:
                await self.avatar_repository.db.commit()

            logger.info(f"Avatar upload completed successfully for user {target_user.id}")
            return s3_key
        except Exception as e:
            logger.error(f"Error in upload_and_activate for user {target_user.id}: {e}", exc_info=True)
            raise

    async def download(self, s3_key: str, file_object: BytesIO):
        await self.s3_service.download_file_obj(file_object, settings.S3_USER_AVATAR_BUCKET, s3_key)
        file_object.seek(0)

    async def get_avatar_model_by_id(self, avatar_id: UUID) -> Avatar:
        avatar = await self.avatar_repository.get_by_id(avatar_id)
        if not avatar:
            raise HTTPException(status_code=404, detail=f"Avatar not found: {avatar_id}")
        return avatar

    async def get_pending_list(self):
        return await self.avatar_repository.get_pending_list()

    async def get_accepted_list(self):
        return await self.avatar_repository.get_accepted_list()

    async def get_rejected_list(self):
        return await self.avatar_repository.get_rejected_list()

    async def moderate(self, avatar_id: UUID, status: AMSEnum, moderator_id: UUID, rejection_reason: str = None) -> str:
        avatar = await self.get_avatar_model_by_id(avatar_id)
        if avatar.moderation_status != AMSEnum.PENDING:
            raise HTTPException(status_code=400, detail="Avatar is not pending review.")
        if status not in [AMSEnum.REJECTED, AMSEnum.ACCEPTED]:
            raise HTTPException(
                status_code=400, detail=f"Invalid status '{status.value}' for moderation. Use ACCEPTED or REJECTED."
            )
        if status == AMSEnum.PENDING and not rejection_reason:
            raise HTTPException(
                status_code=400, detail="A rejection reason is required when setting status to REJECTED."
            )
        moderator = await self.user_service.get_user(moderator_id)
        await self.avatar_repository.set_avatar_status(avatar, status, moderator, rejection_reason)
        return f"Статус аватара {avatar_id} обновлен до {status.value}"

    async def delete(self, avatar_id: UUID):
        avatar = await self.get_avatar_model_by_id(avatar_id)
        user = avatar.user
        new_avatar = await self.avatar_repository.get_previous_avatar(user)
        await self.avatar_repository.set_current_avatar(user, new_avatar)
        await self.avatar_repository.delete_avatar(avatar)
