from app.core.config import settings
from app.services.s3_service import S3Service


def get_s3_service() -> S3Service:
    return S3Service(
        endpoint=settings.S3_ENDPOINT,
        access_key=settings.S3_ROOT_USER,
        secret_key=settings.S3_ROOT_PASSWORD,
        region=settings.S3_REGION,
        public_read=True,
        use_ssl=settings.S3_USE_SSL,
        public_endpoint=settings.S3_PUBLIC_ENDPOINT
    )
