from fastapi import APIRouter

from app.api.v1.endpoints.auth import auth_router
from app.api.v1.endpoints.department import department_router
from app.api.v1.endpoints.employees import employees_router
from app.api.v1.endpoints.filters import filters_router
from app.api.v1.endpoints.legal_entity import le_router
from app.api.v1.endpoints.skills import skills_router

v1_router = APIRouter()
v1_router.include_router(auth_router, tags=["auth"], prefix="/auth")
v1_router.include_router(employees_router, tags=["employees"], prefix="/employees")
v1_router.include_router(le_router, tags=["legal_entities"], prefix="/legal-entities")
v1_router.include_router(department_router, tags=["departments"], prefix="/departments")
v1_router.include_router(skills_router, tags=["skills"], prefix="/skills")
v1_router.include_router(filters_router, tags=["filters"], prefix="/filters")
