from app.core.config import settings
from app.services.s3_service import S3Service


def get_s3_service() -> S3Service:
    return S3Service(
        endpoint=settings.S3_URL,
        user=settings.S3_ROOT_USER,
        password=settings.S3_ROOT_PASSWORD,
    )

