import boto3
import httpx
from botocore.exceptions import BotoCoreError, ClientError

from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import create_async_engine
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import v1_router
from app.core.config import settings
from app.logger import get_logger

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
    yield


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
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@api_router.get("/")
def read_root():
    return {"message": "Ok"}


api_router.include_router(v1_router)
app.include_router(api_router)
