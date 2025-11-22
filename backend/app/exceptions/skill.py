from uuid import UUID

from app.exceptions.service import ServiceError


class SkillError(ServiceError):
    """Base class for all skill-related errors."""
    pass


class SkillNotFound(SkillError):
    """Raised when one or more skills do not exist in the database."""

    def __init__(self, identifiers: str | UUID | list | None = None):
        self.identifiers = identifiers

        if identifiers is None:
            message = "Skill not found"

        elif isinstance(identifiers, (str, UUID)):
            message = f"Skill not found for identifier: {identifiers}"

        elif isinstance(identifiers, list):
            joined = ", ".join(map(str, identifiers))
            message = f"Skills not found: {joined}"

        else:
            message = "Skills not found"

        super().__init__(message)


class SkillAlreadyExists(SkillError):
    """Raised when trying to create a skill that already exists."""

    def __init__(self, skill: str):
        self.skill = skill
        super().__init__(f"Skill '{skill}' already exists")
