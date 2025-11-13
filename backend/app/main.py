import boto3
import httpx
from botocore.exceptions import BotoCoreError, ClientError

from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager

from sqlalchemy import text, select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import v1_router
from app.core.config import settings
from app.enums import RoleEnum
from app.exceptions.handlers import integrity_error_handler
from app.logger import get_logger
from app.models import User
from app.utils.password import get_password_hash

logger = get_logger()


async def check_postgres():
    try:
        engine = create_async_engine(settings.DATABASE_URL_ASYNC)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
        logger.info("PostgreSQL reachable")
    except SQLAlchemyError as e:
        logger.error(f"PostgreSQL check failed", exc_info=True)
        raise e


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


def check_s3():
    try:
        client = boto3.client(
            "s3",
            endpoint_url=settings.S3_URL,
            aws_access_key_id=settings.S3_ROOT_USER,
            aws_secret_access_key=settings.S3_ROOT_PASSWORD,
        )
        buckets = client.list_buckets()
        logger.info("S3 reachable, buckets: %s", [b['Name'] for b in buckets['Buckets']])
    except (BotoCoreError, ClientError) as e:
        logger.error(f"S3 check failed", exc_info=True)
        raise e


def check_prometheus():
    try:
        url = f"http://{settings.PROMETHEUS_HOST}:{settings.PROMETHEUS_PORT}/-/ready"
        response = httpx.get(url, timeout=2.0)
        if response.status_code == 200:
            logger.info("Prometheus reachable")
        else:
            logger.warning(f"Prometheus returned status {response.status_code}")
    except Exception:
        logger.error(f"Prometheus check failed", exc_info=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await check_postgres()
    check_s3()
    check_prometheus()

    engine = create_async_engine(settings.DATABASE_URL_ASYNC)
    try:
        await init_default_admins(engine)
        logger.info("Default administrators initialized.")
        yield
    finally:
        await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs/",
    redoc_url=None
)

api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.add_exception_handler(IntegrityError, integrity_error_handler)  # type: ignore


@api_router.get("/")
def read_root():
    return {"message": "Ok"}


api_router.include_router(v1_router)
app.include_router(api_router)
