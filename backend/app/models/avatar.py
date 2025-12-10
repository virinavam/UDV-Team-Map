from sqlalchemy import Column, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import relationship

from app.enums import AvatarModerationStatusEnum
from app.models import Base
from app.models.mixins import TimeStampMixin


class Avatar(TimeStampMixin, Base):
    __tablename__ = "avatars"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    moderation_status = Column(
        ENUM(AvatarModerationStatusEnum),
        nullable=False,
        default=AvatarModerationStatusEnum.PENDING.value,
        server_default=text(f"'{AvatarModerationStatusEnum.PENDING.value}'"),
    )
    moderated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    s3_key = Column(String(1024), nullable=False, unique=True)
    rejection_reason = Column(String(500), nullable=True)

    user = relationship("User", back_populates="avatars", foreign_keys=[user_id])
    moderated_by = relationship("User", foreign_keys=[moderated_by_id])

    @property
    def url(self) -> str:
        return f"/api/employees/avatars/{self.s3_key}"
