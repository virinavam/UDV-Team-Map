import pytest
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)

BASE_URL = "http://localhost:8000"


@pytest.fixture(scope="session")
def db_session():
    session = Session()
    trans = session.begin()  # старт транзакции
    try:
        yield session
    finally:
        trans.rollback()  # откат всех изменений после тестов
        session.close()


@pytest.fixture(scope="session")
def user_credentials():
    return {
        "email": settings.ADMIN_DEFAULT_EMAIL,
        "password": settings.ADMIN_DEFAULT_PASSWORD
    }


@pytest.fixture(scope="session")
def auth_tokens(user_credentials):
    """Логинимся и получаем токены"""
    r = requests.post(f"{BASE_URL}/api/auth/login", json=user_credentials)
    assert r.status_code == 200, "Login failed"
    data = r.json()
    return data  # {"access_token":..., "refresh_token":..., "user_id":..., "role":...}


@pytest.fixture
def auth_header(auth_tokens):
    return {"Authorization": f"Bearer {auth_tokens['access_token']}"}
