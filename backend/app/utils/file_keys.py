from datetime import datetime
from uuid import UUID, uuid4


def generate_key(user_id: UUID, filename: str) -> str:
    now = datetime.utcnow()
    ext = filename.rsplit(".", 1)[-1].lower()
    uuid_part = f"{uuid4()}.{ext}"
    return (
        f"{user_id}/"
        f"{now.year:04d}_"
        f"{now.month:02d}_"
        f"{now.day:02d}/"
        f"{uuid_part}"
    )
