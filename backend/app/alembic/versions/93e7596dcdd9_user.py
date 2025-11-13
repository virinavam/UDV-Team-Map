"""initial

Revision ID: 93e7596dcdd9
Revises: 41f0ca7af805
Create Date: 2025-11-10 09:35:29.241384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93e7596dcdd9'
down_revision: Union[str, Sequence[str], None] = '41f0ca7af805'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    role_enum = sa.Enum("EMPLOYEE", "HR_ADMIN", "SYSTEM_ADMIN", name="roleenum")
    role_enum.create(op.get_bind(), checkfirst=True)

    op.add_column("users", sa.Column("first_name", sa.String(), nullable=False))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=False))
    op.add_column("users", sa.Column("position", sa.String(), nullable=False))
    op.add_column("users", sa.Column("department", sa.String(), nullable=False))
    op.add_column("users", sa.Column("manager_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("users", sa.Column("telegram", sa.String(), nullable=True))
    op.add_column("users", sa.Column("mattermost", sa.String(), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(), nullable=True))
    op.add_column("users", sa.Column("role", role_enum, nullable=False, server_default="EMPLOYEE"))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.alter_column("users", "email", existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column("users", "hashed_password", new_column_name="password_hash")


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column("users", "password_hash", new_column_name="hashed_password")

    op.drop_column("users", "is_active")
    op.drop_column("users", "role")
    op.drop_column("users", "bio")
    op.drop_column("users", "mattermost")
    op.drop_column("users", "telegram")
    op.drop_column("users", "phone")
    op.drop_column("users", "city")
    op.drop_column("users", "manager_id")
    op.drop_column("users", "department")
    op.drop_column("users", "position")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")

    sa.Enum("EMPLOYEE", "HR_ADMIN", "SYSTEM_ADMIN", name="roleenum").drop(op.get_bind(), checkfirst=True)

