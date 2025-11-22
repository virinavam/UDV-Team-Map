from datetime import datetime, timezone

from sqlalchemy import TIMESTAMP, Column, text
from sqlalchemy.orm import Mapped, declarative_mixin


@declarative_mixin
class TimeStampMixin:
    """
    TimeStamp mixin
        created_at: `datetime`
        updated_at: `datetime`
    """

    created_at: Mapped[datetime] = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        default=datetime.now(timezone.utc),
        server_default=text("current_timestamp(0)"),
    )
    updated_at: Mapped[datetime] = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        default=datetime.now(timezone.utc),
        server_default=text("current_timestamp(0)"),
        onupdate=datetime.now(timezone.utc),
    )
