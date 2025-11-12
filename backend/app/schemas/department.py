from datetime import datetime
from uuid import UUID

from pydantic import Field, BaseModel

from app.schemas.user import UserRead


class DepartmentCreate(BaseModel):
    name: str
    legal_entity_id: UUID
    parent_id: UUID | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, description="Новое название департамента")
    parent_id: UUID | None = None


class DepartmentReadSmall(BaseModel):
    id: UUID
    name: str
    legal_entity_id: UUID
    parent_id: UUID | None = None
    manager: UserRead | None = None
    employees: list[UserRead] = []
    created_at: datetime
    updated_at: datetime


class DepartmentRead(DepartmentReadSmall):
    subdepartments: list[DepartmentReadSmall] = []
