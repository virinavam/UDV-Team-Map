from datetime import datetime
from uuid import UUID, uuid4


def generate_key(user_id: UUID, filename: str | None) -> str:
    now = datetime.utcnow()
    # Обрабатываем случай, когда filename может быть None или без расширения
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
    else:
        ext = "jpg"  # По умолчанию используем jpg
    uuid_part = f"{uuid4()}.{ext}"
    return (
        f"{user_id}/"
        f"{now.year:04d}_"
        f"{now.month:02d}_"
        f"{now.day:02d}/"
        f"{now.hour:02d}_"
        f"{now.minute:02d}_"
        f"{uuid_part}"
    )
