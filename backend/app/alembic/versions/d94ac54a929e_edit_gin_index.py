"""edit_gin_index

Revision ID: d94ac54a929e
Revises: 767fce0aaaa3
Create Date: 2025-11-15 07:34:17.407456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd94ac54a929e'
down_revision: Union[str, Sequence[str], None] = '767fce0aaaa3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Удаляем старый индекс
    op.drop_index('idx_users_fuzzy_search', table_name='users', postgresql_using='gin')

    # Создаём новый GIN TRGM индекс с coalesce и явным gin_trgm_ops
    op.create_index(
        'idx_users_fuzzy_search',
        'users',
        [sa.text(
            "lower(coalesce(first_name, '') || ' ' || "
            "coalesce(last_name, '') || ' ' || "
            "coalesce(position, '') || ' ' || "
            "coalesce(email, '')) gin_trgm_ops"
        )],
        unique=False,
        postgresql_using='gin'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем новый индекс
    op.drop_index('idx_users_fuzzy_search', table_name='users', postgresql_using='gin')

    # Восстанавливаем старый индекс на объединённое поле без coalesce (если нужно)
    op.create_index(
        'idx_users_fuzzy_search',
        'users',
        [sa.text(
            "lower(first_name || ' ' || last_name || ' ' || position || ' ' || email) gin_trgm_ops"
        )],
        unique=False,
        postgresql_using='gin'
    )
