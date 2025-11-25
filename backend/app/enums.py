from enum import Enum


class RoleEnum(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    HR_ADMIN = "HR_ADMIN"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"


class EmployeeStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"  # В сети / на работе
    INACTIVE = "INACTIVE"  # Не активен / оффлайн
    VACATION = "VACATION"  # В отпуске
    SICK = "SICK"  # На больничном
    REMOTE = "REMOTE"  # Работаю удаленно
    TRIP = "TRIP"  # В командировке


class AvatarModerationStatusEnum(str, Enum):
    PENDING = "PENDING"
    REJECTED = "REJECTED"
    ACCEPTED = "ACCEPTED"
    ACTIVE = "ACTIVE"
    DELETED = "DELETED"