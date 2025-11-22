from typing import Awaitable

from fastapi import Request, status
from sqlalchemy.exc import IntegrityError
from app.core.logger import get_logger

from starlette.responses import JSONResponse, Response

from app.exceptions.department import DepartmentError, DepartmentNotFound, DepartmentDeleteError, \
    InvalidParentDepartment, ManagerConflict
from app.exceptions.legal_entity import LegalEntityError, LegalEntityNotFound, LegalEntityAlreadyExists, \
    LegalEntityInUse
from app.exceptions.skill import SkillError, SkillNotFound, SkillAlreadyExists
from app.exceptions.user import UserError, UserNotFound, UserAlreadyExists

logger = get_logger()


async def integrity_error_handler(_: Request, exc: IntegrityError) -> Response | Awaitable[Response]:
    """
    Handler for SQLAlchemy IntegrityError, converting
    database errors into understandable HTTP responses.
    """

    error_detail = "no details"

    # Check whether the message contains DETAIL (PostgreSQL-specific).
    error_parts = str(exc.orig).split("DETAIL:")
    if len(error_parts) > 1:
        error_detail = error_parts[-1].strip()

    logger.warning(f"IntegrityError: {error_detail}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": error_detail}
    )


async def _generic_service_error_handler(request: Request, exc: Exception, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": str(exc)
        }
    )


async def department_error_handler(request: Request, exc: DepartmentError):
    if isinstance(exc, DepartmentNotFound):
        status_code = 404
    elif isinstance(exc, DepartmentDeleteError):
        status_code = 409
    elif isinstance(exc, (InvalidParentDepartment, ManagerConflict)):
        status_code = 400
    else:
        status_code = 400

    return await _generic_service_error_handler(request, exc, status_code)


async def skill_error_handler(request: Request, exc: SkillError):
    if isinstance(exc, SkillNotFound):
        status_code = 404
    elif isinstance(exc, SkillAlreadyExists):
        status_code = 409
    else:
        status_code = 400

    return await _generic_service_error_handler(request, exc, status_code)


async def user_error_handler(request: Request, exc: UserError):
    if isinstance(exc, UserNotFound):
        status_code = 404
    elif isinstance(exc, UserAlreadyExists):
        status_code = 409
    else:
        status_code = 400

    return await _generic_service_error_handler(request, exc, status_code)


async def legal_entity_error_handler(request: Request, exc: LegalEntityError):
    if isinstance(exc, LegalEntityNotFound):
        code = 404
    elif isinstance(exc, LegalEntityAlreadyExists):
        code = 409
    elif isinstance(exc, LegalEntityInUse):
        code = 409
    else:
        code = 400
    return await _generic_service_error_handler(request, exc, code)
