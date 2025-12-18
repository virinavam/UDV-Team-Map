import asyncio
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from sqlalchemy.exc import IntegrityError
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import v1_router
from app.core.config import settings
from app.core.logger import get_logger
from app.deps.db import engine
from app.exceptions.department import DepartmentError
from app.exceptions.handlers import (
    department_error_handler,
    integrity_error_handler,
    legal_entity_error_handler,
    skill_error_handler,
    user_error_handler,
)
from app.exceptions.legal_entity import LegalEntityError
from app.exceptions.skill import SkillError
from app.exceptions.user import UserError
from app.middlewares.limit_upload import LimitUploadSizeMiddleware
from app.services.health_monitor import prometheus_monitor, s3_monitor
from app.startup_checks import check_postgres, init_default_admins

logger = get_logger()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await check_postgres()
    await init_default_admins(engine)
    logger.info("Default administrators initialized.")

    s3_task = asyncio.create_task(s3_monitor.healthcheck_loop(10))
    logger.info("Started S3  health monitoring")
    prometheus_task = asyncio.create_task(prometheus_monitor.healthcheck_loop())
    logger.info("Started Prometheus health monitoring")
    yield
    s3_task.cancel()
    prometheus_task.cancel()
    await prometheus_monitor.client.aclose()
    await engine.dispose()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs/",
    redoc_url=None,
)

api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=10 * 1024 * 1024)

app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(DepartmentError, department_error_handler)
app.add_exception_handler(SkillError, skill_error_handler)
app.add_exception_handler(UserError, user_error_handler)
app.add_exception_handler(LegalEntityError, legal_entity_error_handler)


@api_router.get("/", summary="Read Root")
def read_root():
    return "default"


api_router.include_router(v1_router)
app.include_router(api_router)
