# app/exceptions/handlers.py
from typing import Awaitable

from fastapi import Request, status
from sqlalchemy.exc import IntegrityError
from app.core.logger import get_logger

from starlette.responses import JSONResponse, Response

logger = get_logger()


async def integrity_error_handler(_: Request, exc: IntegrityError) -> Response | Awaitable[Response]:
    """
    Обработчик для IntegrityError (SQLAlchemy), преобразующий ошибки БД
    в понятные HTTP-ответы.
    """

    error_detail = "Ошибка целостности данных."

    # Проверка, содержит ли сообщение DETAIL (специфично для PostgreSQL)
    error_parts = str(exc.orig).split("DETAIL:")
    if len(error_parts) > 1:
        error_detail = error_parts[-1].strip()

    logger.warning(f"IntegrityError: {error_detail}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": error_detail}
    )
