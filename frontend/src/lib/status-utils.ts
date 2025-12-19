/**
 * Утилиты для работы со статусами сотрудников
 */

export type EmployeeStatusType =
  | "ACTIVE"
  | "INACTIVE"
  | "VACATION"
  | "SICK"
  | "REMOTE"
  | "TRIP";

export interface StatusConfig {
  label: string;
  bgColor: string;
  dotColor: string;
  textColor: string;
}

/**
 * Маппинг статусов на русский язык и цвета
 */
export const statusConfig: Record<EmployeeStatusType, StatusConfig> = {
  ACTIVE: {
    label: "Активен",
    bgColor: "rgba(34, 197, 94, 0.1)", // светло-зелёный
    dotColor: "#22c55e", // зелёный
    textColor: "#166534", // тёмно-зелёный
  },
  INACTIVE: {
    label: "Не активен",
    bgColor: "rgba(107, 114, 128, 0.1)", // светло-серый
    dotColor: "#6b7280", // серый
    textColor: "#374151", // тёмно-серый
  },
  VACATION: {
    label: "В отпуске",
    bgColor: "rgba(59, 130, 246, 0.1)", // светло-синий
    dotColor: "#3b82f6", // синий
    textColor: "#1e40af", // тёмно-синий
  },
  SICK: {
    label: "На больничном",
    bgColor: "rgba(239, 68, 68, 0.1)", // светло-красный
    dotColor: "#ef4444", // красный
    textColor: "#7f1d1d", // тёмно-красный
  },
  REMOTE: {
    label: "Удалёнка",
    bgColor: "rgba(168, 85, 247, 0.1)", // светло-фиолетовый
    dotColor: "#a855f7", // фиолетовый
    textColor: "#581c87", // тёмно-фиолетовый
  },
  TRIP: {
    label: "В командировке",
    bgColor: "rgba(249, 115, 22, 0.1)", // светло-оранжевый
    dotColor: "#f97316", // оранжевый
    textColor: "#7c2d12", // тёмно-оранжевый
  },
};

/**
 * Получить конфигурацию статуса
 * @param status - Статус сотрудника (ACTIVE, INACTIVE, VACATION, SICK, REMOTE, TRIP)
 * @returns Конфигурация со стилями и текстом
 */
export const getStatusConfig = (status?: string): StatusConfig => {
  if (!status || !(status in statusConfig)) {
    return statusConfig.ACTIVE; // по умолчанию ACTIVE
  }
  return statusConfig[status as EmployeeStatusType];
};

