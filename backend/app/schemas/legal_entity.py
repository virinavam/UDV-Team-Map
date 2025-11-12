from uuid import UUID

from pydantic import Field, BaseModel


class LegalEntityCreate(BaseModel):
    name: str


class LegalEntityUpdate(BaseModel):
    name: str = Field(..., description="Новое название юридического лица")


class LegalEntityRead(BaseModel):
    id: UUID
    name: str
