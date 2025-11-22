from sqlalchemy import UUID, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.mixins import TimeStampMixin


class Department(TimeStampMixin, Base):
    __tablename__ = "departments"

    # название отдела
    name = Column(String, unique=True, nullable=False)

    # ссылка на юридическое лицо
    legal_entity_id = Column(UUID(as_uuid=True), ForeignKey("legal_entities.id"), nullable=False)

    # ссылка на родительский отдел
    parent_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=True)

    # ссылка на руководителя отдела
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)

    # связь с юридическим лицом
    legal_entity = relationship("LegalEntity", back_populates="departments")

    # связь с родительским отделом
    parent = relationship("Department", remote_side="Department.id", back_populates="subdepartments")

    # связь с дочерними отделами
    subdepartments = relationship("Department", back_populates="parent", order_by="Department.name")

    # связь с руководителем отдела
    manager = relationship(
        "User", back_populates="managed_department", uselist=False, foreign_keys="Department.manager_id"
    )

    # связь с сотрудниками отдела
    employees = relationship("User", back_populates="department", foreign_keys="User.department_id")
