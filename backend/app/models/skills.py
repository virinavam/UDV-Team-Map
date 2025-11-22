from sqlalchemy import UUID, Column, ForeignKey, Index, String, Table, func
from sqlalchemy.orm import relationship

from app.models import Base
from app.models.mixins import TimeStampMixin

user_skills_association = Table(
    "user_skills_association",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)


class Skill(TimeStampMixin, Base):
    __tablename__ = "skills"

    # ID наследуется от BaseModel, не нужно определять явно.
    name = Column(String(100), unique=True, nullable=False)

    # Обратная связь к пользователям
    users = relationship("User", secondary=user_skills_association, back_populates="skills")

    __table_args__ = (
        # Индекс для быстрого и регистронезависимого поиска по имени навыка
        Index("idx_skill_name_lower", func.lower(name), unique=True),
    )
