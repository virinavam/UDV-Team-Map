"""gin_index_search_edit

Revision ID: 85070abdd987
Revises: 767fce0aaaa3
Create Date: 2025-11-13 19:03:10.272401
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '85070abdd987'
down_revision: Union[str, Sequence[str], None] = '767fce0aaaa3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index(op.f('idx_users_fuzzy_search'), table_name='users')

    op.create_index(
        'idx_users_email_trgm',
        'users',
        [sa.text('lower(email) gin_trgm_ops')],
        unique=False,
        postgresql_using='gin'
    )

    op.create_index(
        'idx_users_first_name_trgm',
        'users',
        [sa.text('lower(first_name) gin_trgm_ops')],
        unique=False,
        postgresql_using='gin'
    )

    op.create_index(
        'idx_users_last_name_trgm',
        'users',
        [sa.text('lower(last_name) gin_trgm_ops')],
        unique=False,
        postgresql_using='gin'
    )

    op.create_index(
        'idx_users_position_trgm',
        'users',
        [sa.text('lower(position) gin_trgm_ops')],
        unique=False,
        postgresql_using='gin'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_users_position_trgm', table_name='users')
    op.drop_index('idx_users_last_name_trgm', table_name='users')
    op.drop_index('idx_users_first_name_trgm', table_name='users')
    op.drop_index('idx_users_email_trgm', table_name='users')

    op.create_index(
        op.f('idx_users_fuzzy_search'),
        'users',
        [sa.text(
            "lower(((first_name || ' ' || last_name || ' ' || position || ' ' || email))) gin_trgm_ops"
        )],
        unique=False,
        postgresql_using='gin'
    )
