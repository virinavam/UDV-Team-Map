/**
 * Утилиты для валидации форм
 */

/**
 * Обрезает строку и проверяет, что она не пустая после обрезки
 */
export const trimAndValidate = (value: string | undefined | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed;
};

/**
 * Проверяет, что строка не пустая (после обрезки пробелов)
 */
export const isNotEmpty = (value: string | undefined | null): boolean => {
  return Boolean(trimAndValidate(value));
};

/**
 * Проверяет максимальную длину строки
 */
export const validateMaxLength = (
  value: string | undefined | null,
  maxLength: number
): boolean => {
  if (!value) return true;
  return value.length <= maxLength;
};

/**
 * Проверяет минимальную длину строки (после обрезки)
 */
export const validateMinLength = (
  value: string | undefined | null,
  minLength: number
): boolean => {
  const trimmed = trimAndValidate(value);
  return trimmed.length >= minLength;
};

/**
 * Валидация email
 */
export const validateEmail = (email: string | undefined | null): boolean => {
  if (!email) return false;
  const trimmed = trimAndValidate(email);
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};

/**
 * Валидация телефона (российский формат)
 */
export const validatePhone = (phone: string | undefined | null): boolean => {
  if (!phone) return true; // Телефон не обязателен
  const trimmed = trimAndValidate(phone);
  if (!trimmed) return true;
  // Разрешаем форматы: +7..., 8..., 7..., только цифры
  const phoneRegex = /^[\+]?[7-8]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(trimmed.replace(/\s/g, ""));
};

/**
 * Валидация даты (формат DD.MM.YYYY)
 */
export const validateDate = (date: string | undefined | null): boolean => {
  if (!date) return true; // Дата не обязательна
  const trimmed = trimAndValidate(date);
  if (!trimmed) return true;
  const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  if (!dateRegex.test(trimmed)) return false;
  const [, day, month, year] = trimmed.match(dateRegex)!;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;
  return true;
};

/**
 * Константы для максимальных длин полей
 */
export const FIELD_MAX_LENGTHS = {
  firstName: 50,
  lastName: 50,
  email: 100,
  phone: 20,
  position: 100,
  city: 50,
  department: 200,
  managerName: 100,
  telegram: 50,
  mattermost: 100,
  bio: 1000,
  aboutMe: 1000,
  comment: 500,
  description: 1000,
  workExperience: 50,
  group: 100,
  legalEntity: 100,
} as const;

/**
 * Обязательные поля для создания сотрудника
 */
export const REQUIRED_FIELDS = {
  firstName: "Имя обязательно для заполнения",
  lastName: "Фамилия обязательна для заполнения",
  email: "Email обязателен для заполнения",
} as const;
