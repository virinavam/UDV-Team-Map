import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from typing import ClassVar

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.core.logger import get_logger
from app.deps.s3 import get_s3_service

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
    async def check(self) -> bool:
        """Асинхронная проверка сервиса, возвращает True/False"""
        pass

    async def healthcheck_loop(self, interval: int = 30):
        while True:
            try:
                self.set_status(await self.check())
            except Exception:
                self.set_status(False)
            await asyncio.sleep(interval)


class S3HealthMonitor(BaseHealthMonitor):
    async def check(self) -> bool:
        s3 = get_s3_service()
        return await s3.healthcheck()


class PrometheusHealthMonitor(BaseHealthMonitor):
    client: ClassVar[httpx.AsyncClient] = httpx.AsyncClient(timeout=2.0)

    async def check(self) -> bool:
        url = f"http://{settings.PROMETHEUS_HOST}:{settings.PROMETHEUS_PORT}/-/ready"
        try:
            response = await self.client.get(url)
            return response.status_code == 200
        except httpx.HTTPError:
            return False


def check_s3_health():
    if not s3_monitor.status:
        raise HTTPException(status_code=503, detail=f"S3 is down (last checked: {s3_monitor.last_check}).")


s3_monitor = S3HealthMonitor()
prometheus_monitor = PrometheusHealthMonitor()
