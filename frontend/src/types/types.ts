export interface OrgNode {
  id: string;
  name: string;
  type: "company" | "legal_entity" | "department" | "team" | "employee";
  manager?: boolean;
  children?: OrgNode[];
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  city: string;
  email: string;
  skills: string[];
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // Дата рождения в формате DD.MM.YYYY
  phone?: string; // Номер телефона
  mattermost?: string; // Mattermost username
  telegram?: string; // Telegram username
  department?: string;
  departmentId?: string; // ID отдела (UUID)
  departmentFull?: string; // Полное название подразделения
  managerName?: string; // Имя руководителя
  workExperience?: string; // Стаж работы в компании
  aboutMe?: string; // О себе
  location?: string;
  manager?: boolean;
  // Дополнительные поля для админ-панели
  legalEntity?: string; // Юридическое лицо
  group?: string; // Группа
  hireDate?: string; // Дата найма в формате DD.MM.YYYY
  salary?: number; // Оклад
  employmentStatus?: string; // Статус трудоустройства
  contractNumber?: string; // Номер трудового договора
  description?: string; // Описание
  comment?: string; // Комментарий
  status: "Активен" | "Не активен" | "В отпуске"; //Статус сотрудника
}
