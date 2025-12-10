/**
 * Утилиты для очистки чувствительных данных сотрудников перед отправкой на клиент
 *
 * ВАЖНО: Чувствительные данные (salary, contractNumber) не должны попадать на клиент
 * без явной необходимости и соответствующих прав доступа.
 */

import type { Employee } from "../types/types";

/**
 * Список чувствительных полей, которые не должны попадать на клиент по умолчанию
 */
const SENSITIVE_FIELDS: (keyof Employee)[] = [
  "salary",
  "contractNumber",
  "hireDate", // Дата найма также может быть чувствительной
];

/**
 * Удаляет чувствительные поля из объекта сотрудника
 */
export const sanitizeEmployee = (
  employee: Employee
): Omit<Employee, "salary" | "contractNumber" | "hireDate"> => {
  const { salary, contractNumber, hireDate, ...sanitized } = employee;
  return sanitized;
};

/**
 * Удаляет чувствительные поля из массива сотрудников
 */
export const sanitizeEmployees = (
  employees: Employee[]
): Omit<Employee, "salary" | "contractNumber" | "hireDate">[] => {
  return employees.map(sanitizeEmployee);
};

/**
 * Проверяет, имеет ли пользователь права на просмотр чувствительных данных
 * В реальном приложении это должно проверяться на сервере на основе роли пользователя
 */
export const hasSensitiveDataAccess = (userRole?: string): boolean => {
  // В production это должно проверяться на сервере
  // Здесь возвращаем false для безопасности по умолчанию
  return userRole === "admin" || userRole === "hr";
};

/**
 * Возвращает сотрудника с чувствительными данными, если у пользователя есть права
 */
export const getEmployeeWithSensitiveData = (
  employee: Employee,
  userRole?: string
): Employee => {
  if (hasSensitiveDataAccess(userRole)) {
    return employee;
  }
  return sanitizeEmployee(employee) as Employee;
};
