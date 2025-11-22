import asyncio

from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager

from sqlalchemy.exc import IntegrityError
from starlette.middleware.cors import CORSMiddleware

from app.api.v1.api import v1_router
from app.core.config import settings
from app.exceptions.department import DepartmentError
from app.exceptions.legal_entity import LegalEntityError
from app.exceptions.skill import SkillError
from app.exceptions.user import UserError
from app.services.health_monitor import s3_monitor, prometheus_monitor
from app.exceptions.handlers import integrity_error_handler, department_error_handler, skill_error_handler, \
    user_error_handler, legal_entity_error_handler
from app.core.logger import get_logger
from app.middlewares.limit_upload import LimitUploadSizeMiddleware
from app.startup_checks import check_postgres, init_default_admins
from app.deps.db import engine

logger = get_logger()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await check_postgres()
    try:
        await init_default_admins(engine)
        logger.info("Default administrators initialized.")

        asyncio.create_task(s3_monitor.healthcheck_loop())
        logger.info("Started S3  health monitoring")
        asyncio.create_task(prometheus_monitor.healthcheck_loop())
        logger.info("Started Prometheus health monitoring")
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

app.add_middleware(
    LimitUploadSizeMiddleware,
    max_upload_size=10 * 1024 * 1024
)

app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(DepartmentError, department_error_handler)
app.add_exception_handler(SkillError, skill_error_handler)
app.add_exception_handler(UserError, user_error_handler)
app.add_exception_handler(LegalEntityError, legal_entity_error_handler)


@api_router.get("/")
def read_root():
    return {"message": "Ok"}


api_router.include_router(v1_router)
app.include_router(api_router)
