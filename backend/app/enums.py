from enum import Enum

class RoleEnum(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    HR_ADMIN = "HR_ADMIN"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
