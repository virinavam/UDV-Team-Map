from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.enums import AvatarModerationStatusEnum
from app.schemas.user import UserRead


class AvatarModeration(BaseModel):
    status: AvatarModerationStatusEnum
    rejection_reason: str | None = None


class AvatarBase(BaseModel):
    user: UserRead
    url: str


class AvatarRead(AvatarBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
