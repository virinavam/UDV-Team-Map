from app.exceptions.service import ServiceError


class LegalEntityError(ServiceError):
    pass


class LegalEntityNotFound(LegalEntityError):
    pass


class LegalEntityInUse(LegalEntityError):
    pass


class LegalEntityAlreadyExists(LegalEntityError):
    pass
