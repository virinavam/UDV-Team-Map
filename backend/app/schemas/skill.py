from uuid import UUID

from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str


class SkillUpdate(BaseModel):
    name: str

class SkillRead(BaseModel):
    name: str
    id: UUID