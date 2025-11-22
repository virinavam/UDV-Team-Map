from uuid import UUID

from app.exceptions.service import ServiceError


class LegalEntityError(ServiceError):
    """Base class for all legal entity related errors."""

    pass


class LegalEntityNotFound(LegalEntityError):
    """Raised when a legal entity does not exist in the database."""

    def __init__(self, identifier: str | UUID | None = None):
        self.identifier = identifier
        if identifier is None:
            message = "Legal entity not found."
        else:
            message = f"Legal entity not found: {identifier}"
        super().__init__(message)


class LegalEntityAlreadyExists(LegalEntityError):
    """Raised when trying to create a legal entity that already exists."""

    def __init__(self, name: str | None = None):
        self.name = name
        if name:
            super().__init__(f"Legal entity '{name}' already exists.")
        else:
            super().__init__("Legal entity already exists.")


class LegalEntityInUse(LegalEntityError):
    """Raised when trying to delete a legal entity that has dependent records."""

    def __init__(self, identifier: str | UUID | None = None, details: str | None = None):
        self.identifier = identifier
        self.details = details
        message = f"Cannot delete legal entity {identifier}" if identifier else "Cannot delete legal entity"
        if details:
            message += f": {details}"
        super().__init__(message)
