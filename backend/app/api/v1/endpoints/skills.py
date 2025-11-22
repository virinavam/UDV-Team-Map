from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from starlette import status

from app.deps.skill import get_skill_service
from app.enums import RoleEnum
from app.exceptions.skill import SkillAlreadyExists, SkillNotFound
from app.core.logger import get_logger
from app.services.skill_service import SkillService
from app.schemas.skill import SkillCreate, SkillUpdate, SkillRead
from app.utils.auth import require_roles

skills_router = APIRouter()
logger = get_logger()


@skills_router.get("/", response_model=list[SkillRead],
                   summary="Получить все навыки сотрудников",
                   dependencies=[
                       Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def get_all_skills(skill_service: SkillService = Depends(get_skill_service)):
    return await skill_service.get_all_skills()


@skills_router.post("/", response_model=SkillRead,
                    summary="Создать навык сотрудника",
                    dependencies=[
                        Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def create_skill(skill: SkillCreate, skill_service: SkillService = Depends(get_skill_service)):
    try:
        return await skill_service.create_skill(skill)
    except SkillAlreadyExists as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@skills_router.patch("/{skill_id}", response_model=SkillRead,
                     summary="Обновить навык сотрудника",
                     dependencies=[
                         Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def update_skill(skill_id: UUID, skill: SkillUpdate, skill_service: SkillService = Depends(get_skill_service)):
    try:
        return await skill_service.update_skill(skill_id, skill)
    except SkillAlreadyExists as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except SkillNotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@skills_router.delete("/{skill_id}",
                      status_code=204,
                      summary="Удалить навык сотрудника",
                      dependencies=[
                          Depends(require_roles(RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))])
async def delete_skill(skill_id: UUID, skill_service: SkillService = Depends(get_skill_service)):
    try:
        await skill_service.delete_skill(skill_id)
        logger.info("Навык с ID %s успешно удален.", skill_id)
    except SkillNotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
