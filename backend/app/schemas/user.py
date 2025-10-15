from pydantic import BaseModel, EmailStr, ConfigDict


# Схема для создания пользователя (что мы получаем от клиента)
class UserCreate(BaseModel):
    email: EmailStr
    password: str


# Схема для чтения данных пользователя (что мы отдаем клиенту)
class UserInDBBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # Позволяет создавать из ORM-моделей

    id: int
    email: EmailStr


# Финальная схема, которую возвращает API
class User(UserInDBBase):
    pass
