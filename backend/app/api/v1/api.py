from app.api.v1.endpoints.auth import auth_router
from app.api.v1.endpoints.employees import employees_router
from fastapi import APIRouter

v1_router = APIRouter()
v1_router.include_router(auth_router, tags=["auth"], prefix="/auth")
v1_router.include_router(employees_router, tags=["employees"], prefix="/employees")
