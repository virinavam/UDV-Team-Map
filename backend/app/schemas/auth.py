from uuid import UUID
from pydantic import BaseModel
from app.enums import RoleEnum


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: UUID
    role: RoleEnum
