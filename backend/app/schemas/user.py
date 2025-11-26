from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.enums import EmployeeStatusEnum, RoleEnum
from app.schemas.skill import SkillRead


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Рабочая почта (логин в системе)")
    password: str = Field(..., min_length=6, description="Пароль для нового пользователя")


class UserRegisterRequest(UserLoginRequest):
    first_name: str = Field(..., max_length=100, description="Имя сотрудника")
    last_name: str = Field(..., max_length=100, description="Фамилия сотрудника")


class UserBase(BaseModel):
    first_name: Optional[str] = Field(..., max_length=100, description="Имя сотрудника")
    last_name: Optional[str] = Field(..., max_length=100, description="Фамилия сотрудника")
    email: EmailStr = Field(..., description="Рабочая почта (логин в системе)")
    position: Optional[str] = Field(None, max_length=150, description="Должность сотрудника")
    department_id: Optional[UUID] = Field(None, description="ID отдела")
    role: RoleEnum = Field(default=RoleEnum.EMPLOYEE, description="Роль в системе (права доступа)")
    city: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    telegram: Optional[str] = Field(None, max_length=100)
    mattermost: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    skills: list[SkillRead] = []
    birthday: Optional[date] = None
    photo_url: Optional[str] = None
    employee_status: Optional[EmployeeStatusEnum] = None
    is_active: bool = True


class UserRead(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    phone: Optional[str] = Field(None, max_length=50)
    telegram: Optional[str] = Field(None, max_length=100)
    mattermost: Optional[str] = Field(None, max_length=100)
    employee_status: Optional[EmployeeStatusEnum] = None
    bio: Optional[str] = None

class UserUpdateAdmin(UserUpdate):
    first_name: Optional[str] = Field(None, max_length=100, description="Имя сотрудника")
    last_name: Optional[str] = Field(None, max_length=100, description="Фамилия сотрудника")
    email: Optional[EmailStr] = Field(None, description="Рабочая почта (логин в системе)")
    position: Optional[str] = Field(None, max_length=150, description="Должность сотрудника")
    department_id: Optional[UUID] = Field(None, description="ID отдела")
    role: Optional[RoleEnum] = Field(None, description="Роль в системе (права доступа)")
    city: Optional[str] = Field(None, max_length=100)
    birthday: Optional[date] = None
