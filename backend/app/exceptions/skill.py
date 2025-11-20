from app.exceptions.service import ServiceError


class SkillError(ServiceError):
    pass


class SkillNotFoundError(SkillError):
    pass


class SkillAlreadyExistsError(SkillError):
    pass
