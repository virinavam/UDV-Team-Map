from sqlalchemy import Column, String
from app.models.base import Base
from app.models.mixins import TimeStampMixin


class User(TimeStampMixin, Base):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)