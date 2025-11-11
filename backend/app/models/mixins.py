from datetime import datetime, UTC

from sqlalchemy import Column
from sqlalchemy import TIMESTAMP
from sqlalchemy import text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import declarative_mixin


@declarative_mixin
class TimeStampMixin:
    """
    TimeStamp mixin
        created_at: `datetime`
        updated_at: `datetime`
    """

    created_at: Mapped[datetime] = Column(
        TIMESTAMP(timezone=False),
        nullable=True,
        default=datetime.now(UTC),
        server_default=text("current_timestamp(0)"),
    )
    updated_at: Mapped[datetime] = Column(
        TIMESTAMP(timezone=False),
        nullable=True,
        default=datetime.now(UTC),
        server_default=text("current_timestamp(0)"),
        onupdate=datetime.now(UTC),
    )