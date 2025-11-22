from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.enums import RoleEnum
from app.models import User
from app.utils.password import get_password_hash
from app.core.logger import get_logger

logger = get_logger()


async def check_postgres():
    try:
        engine = create_async_engine(settings.DATABASE_URL_ASYNC)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
        logger.info("PostgreSQL reachable")
    except SQLAlchemyError as e:
        logger.error("PostgreSQL check failed", exc_info=True)
        raise RuntimeError("Cannot connect to PostgreSQL") from e


async def init_default_admins(engine):
    """Создает системного и HR-администратора, если они не существуют."""
    sys_admin_email = settings.ADMIN_DEFAULT_EMAIL
    hr_admin_email = settings.HR_DEFAULT_EMAIL

    users_to_create = [
        {
            "email": sys_admin_email,
            "role": RoleEnum.SYSTEM_ADMIN,
            "first_name": "System",
            "last_name": "Admin",
            "password": settings.ADMIN_DEFAULT_PASSWORD,
        },
        {
            "email": hr_admin_email,
            "role": RoleEnum.HR_ADMIN,
            "first_name": "HR",
            "last_name": "Admin",
            "password": settings.HR_DEFAULT_PASSWORD,
        },
    ]

    async with AsyncSession(engine) as session:
        for user_data in users_to_create:
            # 1. Проверяем, существует ли пользователь
            existing_user = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            if existing_user.scalar_one_or_none():
                logger.info(f"User {user_data['email']} already exists. Skipping.")
                continue

            # 2. Создаем нового пользователя
            hashed_password = get_password_hash(user_data["password"])

            new_user = User(
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                role=user_data["role"],
                password_hash=hashed_password,
            )

            session.add(new_user)
            logger.info(f"Created default user: {user_data['email']} ({user_data['role'].value})")

        await session.commit()
