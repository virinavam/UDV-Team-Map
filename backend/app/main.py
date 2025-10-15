from fastapi import FastAPI
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI (Poetry + Alembic + Pydantic)!"}
