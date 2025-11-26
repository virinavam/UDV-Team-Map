"""update_user_model

Revision ID: 447fc7fffa5f
Revises: 93e7596dcdd9
Create Date: 2025-11-11 11:28:37.490257
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '447fc7fffa5f'
down_revision: Union[str, Sequence[str], None] = '93e7596dcdd9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавление новых колонок
    op.add_column('users', sa.Column('department_id', sa.UUID(), nullable=True))
    op.add_column('users', sa.Column('birthday', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('photo_url', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('employee_status', sa.String(length=32), nullable=True))

    # Обновление существующих колонок
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(),
               nullable=False)

    # Исправленный alter_column для manager_id с конвертацией
    op.alter_column(
        'users',
        'manager_id',
        existing_type=sa.VARCHAR(),
        type_=sa.UUID(),
        existing_nullable=True,
        postgresql_using='manager_id::uuid'
    )

    op.alter_column('users', 'bio',
               existing_type=sa.VARCHAR(),
               type_=sa.Text(),
               existing_nullable=True)

    # Индексы и уникальные ограничения
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.create_unique_constraint(op.f('uq_users_email'), 'users', ['email'])

    # Удаление устаревшей колонки
    op.drop_column('users', 'department')


def downgrade() -> None:
    """Downgrade schema."""
    # Восстановление удалённой колонки
    op.add_column('users', sa.Column('department', sa.VARCHAR(), autoincrement=False, nullable=False))

    # Восстановление уникального индекса email
    op.drop_constraint(op.f('uq_users_email'), 'users', type_='unique')
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Обратное преобразование колонок
    op.alter_column('users', 'bio',
               existing_type=sa.Text(),
               type_=sa.VARCHAR(),
               existing_nullable=True)

    # Обратное преобразование manager_id из UUID в VARCHAR
    op.alter_column(
        'users',
        'manager_id',
        existing_type=sa.UUID(),
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    # Сделать password_hash nullable обратно
    op.alter_column('users', 'password_hash',
               existing_type=sa.VARCHAR(),
               nullable=True)

    # Удаление новых колонок
    op.drop_column('users', 'employee_status')
    op.drop_column('users', 'photo_url')
    op.drop_column('users', 'birthday')
    op.drop_column('users', 'department_id')
