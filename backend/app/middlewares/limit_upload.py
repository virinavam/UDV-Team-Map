from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request, call_next):
        content_length = request.headers.get("Content-Length")

        if content_length and int(content_length) > self.max_upload_size:
            return JSONResponse(
                {"detail": f"File too large. Max size is {self.max_upload_size // (1024 * 1024)}MB"},
                status_code=413
            )

        return await call_next(request)
