from sqlalchemy import Column, String, Boolean, Text, Date
from sqlalchemy.dialects.postgresql import UUID, ENUM
from app.models.base import Base
from app.models.mixins import TimeStampMixin
from app.enums import RoleEnum


class User(TimeStampMixin, Base):
    __tablename__ = "users"

    first_name = Column(String(100), nullable=False)  # Имя сотрудника
    last_name = Column(String(100), nullable=False)  # Фамилия сотрудника
    email = Column(String(255), unique=True, nullable=False)  # Рабочая почта (логин в системе)
    password_hash = Column(String(255), nullable=False)  # Хэш пароля
    position = Column(String(150), nullable=False)  # Должность сотрудника
    department_id = Column(UUID(as_uuid=True), nullable=True)  # Связь с отделом (UUID, без FK)
    manager_id = Column(UUID(as_uuid=True), nullable=True)  # ID руководителя (self-relation)
    role = Column(ENUM(RoleEnum), nullable=False, default=RoleEnum.EMPLOYEE)  # Роль в системе (права доступа)
    city = Column(String(100), nullable=True)  # Город, в котором работает сотрудник
    phone = Column(String(50), nullable=True)  # Телефон
    telegram = Column(String(100), nullable=True)  # Аккаунт Telegram
    mattermost = Column(String(100), nullable=True)  # Аккаунт Mattermost
    bio = Column(Text, nullable=True)  # Краткое описание / информация о себе
    birthday = Column(Date, nullable=True)  # Дата рождения
    photo_url = Column(String(255), nullable=True)  # Ссылка на фото сотрудника
    employee_status = Column(String(32), nullable=True)  # Редактируемый пользователем статус
    is_active = Column(Boolean, nullable=False, default=True)  # Активен ли сотрудник в системе (технический флаг)
