/**
 * Утилиты для фильтрации сотрудников
 */

import type { Employee } from "../types/types";
import { searchEmployees } from "./search-utils";

export interface FilterParams {
  search?: string;
  city?: string;
  skills?: string[];
  legalEntity?: string[];
  department?: string[];
  group?: string[];
  position?: string[];
}

/**
 * Применяет клиентскую фильтрацию к списку сотрудников
 * Используется когда серверная фильтрация недоступна или недостаточна
 */
export const applyClientFilters = (
  employees: Employee[],
  filters: FilterParams
): Employee[] => {
  let filtered = [...employees];

  // Универсальный поиск с fuzzy matching
  if (filters.search?.trim()) {
    filtered = searchEmployees(filtered, filters.search, {
      fuzzyThreshold: 0.5,
      matchAllTokens: false,
    });
  }

  // Фильтр по городу
  if (filters.city) {
    filtered = filtered.filter((emp) => emp.city === filters.city);
  }

  // Фильтр по навыкам
  if (filters.skills && filters.skills.length > 0) {
    filtered = filtered.filter((emp) =>
      filters.skills!.some((skill) => emp.skills?.includes(skill))
    );
  }

  // Фильтр по юридическому лицу
  if (filters.legalEntity && filters.legalEntity.length > 0) {
    filtered = filtered.filter((employee) => {
      const entity =
        employee.legalEntity || employee.departmentFull?.split(" / ")[0];
      return entity && filters.legalEntity!.includes(entity);
    });
  }

  // Фильтр по подразделению
  if (filters.department && filters.department.length > 0) {
    filtered = filtered.filter((employee) => {
      const dep =
        employee.departmentFull?.split(" / ")[2] || employee.department;
      return dep && filters.department!.includes(dep);
    });
  }

  // Фильтр по группе
  if (filters.group && filters.group.length > 0) {
    filtered = filtered.filter(
      (employee) => employee.group && filters.group!.includes(employee.group)
    );
  }

  // Фильтр по должности
  if (filters.position && filters.position.length > 0) {
    filtered = filtered.filter(
      (employee) =>
        employee.position && filters.position!.includes(employee.position)
    );
  }

  return filtered;
};
