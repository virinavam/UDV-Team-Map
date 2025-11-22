from uuid import UUID

from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str


class SkillUpdate(BaseModel):
    name: str


class SetSkillsRequest(BaseModel):
    skills: list[str]


class SkillRead(BaseModel):
    name: str
    id: UUID
