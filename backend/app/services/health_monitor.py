import asyncio
from datetime import datetime
from abc import ABC, abstractmethod
from app.core.logger import get_logger
import httpx
from app.deps.s3 import get_s3_service
from app.core.config import settings

logger = get_logger()


class BaseHealthMonitor(ABC):
    def __init__(self):
        self.status: bool = False
        self.last_check: datetime = datetime.utcnow()

    def set_status(self, ok: bool):
        if self.status != ok:
            logger.warning(f"{self.__class__.__name__} status changed: {self.status} -> {ok}")
        self.status = ok
        self.last_check = datetime.utcnow()

    @abstractmethod
    def check(self) -> bool:
        """Синхронная проверка сервиса, возвращает True/False"""
        pass

    async def healthcheck_loop(self, interval: int = 30):
        while True:
            try:
                self.set_status(self.check())
            except Exception:
                self.set_status(False)
            await asyncio.sleep(interval)


class S3HealthMonitor(BaseHealthMonitor):
    def check(self) -> bool:
        s3 = get_s3_service()
        return s3.healthcheck()


class PrometheusHealthMonitor(BaseHealthMonitor):
    def check(self) -> bool:
        url = f"http://{settings.PROMETHEUS_HOST}:{settings.PROMETHEUS_PORT}/-/ready"
        response = httpx.get(url, timeout=2.0)
        return response.status_code == 200


s3_monitor = S3HealthMonitor()
prometheus_monitor = PrometheusHealthMonitor()
