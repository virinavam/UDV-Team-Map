from sqlalchemy import Column, String, ForeignKey, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.mixins import TimeStampMixin


class Department(TimeStampMixin, Base):
    __tablename__ = "departments"

    # название отдела
    name = Column(String, unique=True, nullable=False)

    # ссылка на юридическое лицо
    legal_entity_id = Column(UUID(as_uuid=True), ForeignKey('legal_entities.id'), nullable=False)

    # ссылка на родительский отдел
    parent_id = Column(UUID(as_uuid=True), ForeignKey('departments.id', ondelete="RESTRICT"), nullable=True)

    # связь с юридическим лицом
    legal_entity = relationship("LegalEntity", back_populates="departments")

    # связь с родительским отделом
    parent = relationship("Department", remote_side=[Base.id], back_populates="subdepartments")

    # связь с дочерними отделами
    subdepartments = relationship("Department", back_populates="parent")
