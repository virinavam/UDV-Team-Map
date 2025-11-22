from uuid import UUID

from app.exceptions.service import ServiceError


class UserError(ServiceError):
    pass


class UserNotFound(UserError):
    def __init__(self, identifier: str | UUID | None = None):

        if identifier is None:
            message = "User not found"

        else:
            message = f"User not found: {identifier}"

        super().__init__(message)


class UserAlreadyExists(UserError):
    def __init__(self, identifier: str | UUID | None = None):

        if identifier is None:
            super().__init__("User already exists")
        else:
            super().__init__(f"User already exists: {identifier}")
