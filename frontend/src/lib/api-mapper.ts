/**
 * Маппинг данных между форматом бэкенда и форматом фронтенда
 */

import type { Employee } from "../types/types";
import { getPhotoUrl } from "./photo-utils";

/**
 * Формат данных, который возвращает бэкенд
 */
export interface BackendUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string | null;
  city?: string | null;
  phone?: string | null;
  telegram?: string | null;
  mattermost?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  birthday?: string | null;
  department_id?: string | null;
  role?: string;
  employee_status?: string | null;
  is_active?: boolean;
  skills?: Array<{ id: string; name: string }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Преобразует данные сотрудника из формата бэкенда в формат фронтенда
 */
export const mapBackendUserToEmployee = (
  backendUser: BackendUser
): Employee => {
  return {
    id: backendUser.id,
    firstName: backendUser.first_name || "",
    lastName: backendUser.last_name || "",
    name:
      `${backendUser.last_name || ""} ${backendUser.first_name || ""}`.trim() ||
      backendUser.email,
    email: backendUser.email,
    position: backendUser.position || "",
    city: backendUser.city || "",
    location: backendUser.city || "",
    phone: backendUser.phone || "",
    telegram: backendUser.telegram || "",
    mattermost: backendUser.mattermost || "",
    aboutMe: backendUser.bio || "",
    photoUrl: getPhotoUrl(backendUser.photo_url) || "/placeholder.svg",
    dateOfBirth: backendUser.birthday || undefined,
    skills: backendUser.skills?.map((s) => s.name) || [],
    status: backendUser.is_active ? "Активен" : "Не активен",
    employmentStatus: backendUser.employee_status || "ACTIVE",
    // Дополнительные поля, которые могут отсутствовать в бэкенде
    departmentId: backendUser.department_id || undefined,
    department: undefined,
    departmentFull: undefined,
    managerName: undefined,
    workExperience: undefined,
    legalEntity: undefined,
    group: undefined,
    hireDate: undefined,
    salary: undefined,
    contractNumber: undefined,
    description: undefined,
    comment: undefined,
    manager: false,
  };
};

/**
 * Преобразует данные сотрудника из формата фронтенда в формат бэкенда
 */
export const mapEmployeeToBackendUser = (
  employee: Partial<Employee>
): Partial<BackendUser> => {
  const result: Partial<BackendUser> = {};

  if (employee.firstName !== undefined) result.first_name = employee.firstName;
  if (employee.lastName !== undefined) result.last_name = employee.lastName;
  if (employee.email !== undefined) result.email = employee.email;
  if (employee.position !== undefined) result.position = employee.position;
  if (employee.city !== undefined) result.city = employee.city;
  if (employee.phone !== undefined) result.phone = employee.phone;
  if (employee.telegram !== undefined) result.telegram = employee.telegram;
  if (employee.mattermost !== undefined)
    result.mattermost = employee.mattermost;
  if (employee.aboutMe !== undefined) result.bio = employee.aboutMe;
  // photo_url не отправляем, так как это read-only поле
  // Для обновления аватара используется отдельный эндпоинт
  if (employee.dateOfBirth !== undefined) {
    // Преобразуем дату из формата DD.MM.YYYY в YYYY-MM-DD
    if (employee.dateOfBirth) {
      const dateParts = employee.dateOfBirth.split(".");
      if (dateParts.length === 3) {
        result.birthday = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      } else {
        result.birthday = employee.dateOfBirth;
      }
    } else {
      result.birthday = null;
    }
  }
  // employee_status из employmentStatus
  if (employee.employmentStatus !== undefined) {
    result.employee_status = employee.employmentStatus || null;
  }
  // department_id - используем departmentId если есть, иначе пытаемся использовать department как UUID
  if (employee.departmentId !== undefined) {
    result.department_id = employee.departmentId || null;
  } else if (employee.department !== undefined) {
    // Проверяем, является ли department валидным UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (employee.department && uuidRegex.test(employee.department)) {
      result.department_id = employee.department;
    } else {
      // Если это не UUID, то это название отдела - отправляем null
      // (для установки отдела по названию нужно сначала найти его ID)
      result.department_id = null;
    }
  }

  // Очищаем пустые строки, заменяя их на null для соответствия схеме бэкенда
  Object.keys(result).forEach((key) => {
    const value = result[key as keyof typeof result];
    if (value === "") {
      (result as any)[key] = null;
    }
  });

  return result;
};
