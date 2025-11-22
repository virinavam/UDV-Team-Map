from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.mixins import TimeStampMixin


class LegalEntity(TimeStampMixin, Base):
    __tablename__ = "legal_entities"

    name = Column(String, unique=True, nullable=False)  # название юрлица
    departments = relationship(
        "Department", back_populates="legal_entity", order_by="Department.name"
    )  # связь с департаментами
