from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.department_service import DepartmentService


async def get_department_service(db: AsyncSession = Depends(get_db)) -> DepartmentService:
    """Зависимость, предоставляющая экземпляр DepartmentService."""
    return DepartmentService(db)