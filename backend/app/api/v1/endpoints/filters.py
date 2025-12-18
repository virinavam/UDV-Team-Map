from fastapi import APIRouter, Depends

from app.deps.department import get_department_service
from app.deps.legal_entity import get_le_service
from app.deps.skill import get_skill_service
from app.deps.user import get_user_service
from app.enums import RoleEnum
from app.services.department_service import DepartmentService
from app.services.legal_entity_service import LegalEntityService
from app.services.skill_service import SkillService
from app.services.user_service import UserService
from app.utils.auth import require_roles

filters_router = APIRouter()


@filters_router.get(
    "/options",
    summary="Получить опции для фильтров",
    dependencies=[Depends(require_roles(RoleEnum.EMPLOYEE, RoleEnum.HR_ADMIN, RoleEnum.SYSTEM_ADMIN))],
)
async def get_filter_options(
    user_service: UserService = Depends(get_user_service),
    skill_service: SkillService = Depends(get_skill_service),
    le_service: LegalEntityService = Depends(get_le_service),
    dep_service: DepartmentService = Depends(get_department_service),
):
    """
    Возвращает опции для фильтров на основе реальных данных:
    - cities: список уникальных городов из карточек сотрудников
    - skills: список всех навыков
    - legalEntities: список всех юридических лиц
    - departments: список всех подразделений
    - groups: пустой массив (поле group отсутствует в модели User)
    - positions: список уникальных должностей из карточек сотрудников
    """
    cities = await user_service.get_cities()
    skills = await skill_service.get_all_skills()
    legal_entities = await le_service.get_all_legal_entities()
    departments = await dep_service.get_all_departments()
    positions = await user_service.get_positions()

    return {
        "cities": list(cities),
        "skills": [skill.name for skill in skills],
        "legalEntities": [le.name for le in legal_entities],
        "departments": [dept.name for dept in departments],
        "groups": [],  # Поле group отсутствует в модели User
        "positions": list(positions),
    }
