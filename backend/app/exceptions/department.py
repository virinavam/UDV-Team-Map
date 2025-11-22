from uuid import UUID

from app.exceptions.service import ServiceError


class DepartmentError(ServiceError):
    """Base class for all department-related errors."""

    pass


class DepartmentNotFound(DepartmentError):
    """Raised when a department does not exist."""

    def __init__(self, department_id: UUID | None = None):
        self.department_id = department_id
        if department_id:
            message = f"Department with ID {department_id} not found"
        else:
            message = "Department not found"
        super().__init__(message)


class DepartmentConflict(DepartmentError):
    """Raised when a department cannot be modified due to business rules."""

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class InvalidParentDepartment(DepartmentError):
    """Raised when parent department is invalid or causes loop/illegal state."""

    def __init__(self, parent_id: UUID, message: str):
        self.parent_id = parent_id
        super().__init__(f"Invalid parent department {parent_id}: {message}")


class ManagerConflict(DepartmentError):
    """Raised when a user is already assigned as manager of another department."""

    def __init__(self, manager_id: UUID, department_id: UUID):
        self.manager_id = manager_id
        self.department_id = department_id
        super().__init__(f"Manager {manager_id} already manages department {department_id}")


class DepartmentDeleteError(DepartmentError):
    """Raised when a department cannot be deleted due to business rules."""

    def __init__(self, department_id: UUID, subdepartments: int = 0, users: int = 0):
        self.department_id = department_id
        self.subdepartments = subdepartments
        self.users = users
        details = []
        if subdepartments > 0:
            details.append(f"{subdepartments} subdepartment(s)")
        if users > 0:
            details.append(f"{users} user(s)")
        message = f"Cannot delete department {department_id}, it has {' and '.join(details)}."
        super().__init__(message)
