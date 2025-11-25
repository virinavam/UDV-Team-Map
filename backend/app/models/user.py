from sqlalchemy import Boolean, Column, Date, ForeignKey, Index, String, Text, func, text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import relationship

from app.enums import EmployeeStatusEnum, RoleEnum
from app.models.base import Base
from app.models.mixins import TimeStampMixin
from app.models.skill import user_skills_association


class User(TimeStampMixin, Base):
    __tablename__ = "users"

    first_name = Column(String(100), nullable=False)  # Имя сотрудника
    last_name = Column(String(100), nullable=False)  # Фамилия сотрудника
    email = Column(String(255), unique=True, nullable=False)  # Рабочая почта (логин в системе)
    password_hash = Column(String(255), nullable=False)  # Хэш пароля
    position = Column(String(150), nullable=True)  # Должность сотрудника
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)  # Связь с отделом
    role = Column(
        ENUM(RoleEnum),
        nullable=False,
        default=RoleEnum.EMPLOYEE.value,
        server_default=text(f"'{RoleEnum.EMPLOYEE.value}'"),
    )  # Роль в системе (права доступа)
    city = Column(String(100), nullable=True)  # Город, в котором работает сотрудник
    phone = Column(String(50), nullable=True)  # Телефон
    telegram = Column(String(100), nullable=True)  # Аккаунт Telegram
    mattermost = Column(String(100), nullable=True)  # Аккаунт Mattermost
    bio = Column(Text, nullable=True)  # Краткое описание / информация о себе
    birthday = Column(Date, nullable=True)  # Дата рождения
    current_avatar_id = Column(UUID(as_uuid=True), ForeignKey("avatars.id"), nullable=True)
    employee_status = Column(ENUM(EmployeeStatusEnum), nullable=True)  # Редактируемый пользователем статус
    # Активен ли сотрудник в системе (технический флаг)
    is_active = Column(Boolean, nullable=False, default=True, server_default=text("true"))

    skills = relationship("Skill", secondary=user_skills_association, back_populates="users", lazy="selectin")

    department = relationship("Department", back_populates="employees", foreign_keys=[department_id])

    managed_department = relationship(
        "Department", back_populates="manager", uselist=False, foreign_keys="Department.manager_id"
    )

    avatars = relationship("Avatar", back_populates="user", foreign_keys="Avatar.user_id",
                           order_by="desc(Avatar.created_at)")

    current_avatar = relationship("Avatar", foreign_keys=[current_avatar_id], uselist=False, remote_side="Avatar.id")

    __table_args__ = (
        Index(
            "idx_users_fuzzy_search",
            func.lower(
                func.coalesce(first_name, "")
                + " "
                + func.coalesce(last_name, "")
                + " "
                + func.coalesce(position, "")
                + " "
                + func.coalesce(email, "")
            ),
            postgresql_using="gin",
            postgresql_ops={"lower": "gin_trgm_ops"},
        ),
    )
