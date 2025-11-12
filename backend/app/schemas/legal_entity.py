from datetime import datetime
from uuid import UUID

from pydantic import Field, BaseModel
from app.schemas.department import DepartmentReadSmall


class LegalEntityCreate(BaseModel):
    name: str


class LegalEntityUpdate(BaseModel):
    name: str = Field(..., description="Новое название юридического лица")


class LegalEntityRead(BaseModel):
    id: UUID
    name: str
    departments: list[DepartmentReadSmall] = []
    created_at: datetime
    updated_at: datetime
