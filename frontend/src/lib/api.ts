import type { Employee, OrgNode } from "../types/types";
import {
  mapBackendUserToEmployee,
  mapEmployeeToBackendUser,
  type BackendUser,
} from "./api-mapper";
import {
  getPhotoUrl,
  clearPhotoCache,
  clearPhotoFromCache,
} from "./photo-utils";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem("authToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Добавляем токен авторизации, если он есть и не был передан явно
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Собираем финальные опции, убеждаясь, что headers и body правильно обработаны
  const {
    body: optionsBody,
    headers: optionsHeaders,
    ...restOptions
  } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    ...restOptions,
    headers,
    ...(optionsBody !== undefined && { body: optionsBody }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));

    // Обработка ошибок валидации FastAPI (422)
    let errorMessage = "Request failed";
    if (errorData?.detail) {
      if (Array.isArray(errorData.detail)) {
        // Форматируем ошибки валидации
        errorMessage = errorData.detail
          .map((err: any) => {
            const field = err.loc?.join(".") || "field";
            return `${field}: ${err.msg || err.message || "Ошибка валидации"}`;
          })
          .join("; ");
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else {
        errorMessage = JSON.stringify(errorData.detail);
      }
    } else if (errorData?.message) {
      errorMessage = errorData.message;
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  // Обработка пустого ответа (например, 204 No Content или DELETE запросы)
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type");
  
  // Если ответ пустой или нет контента, возвращаем undefined
  if (
    response.status === 204 ||
    contentLength === "0" ||
    !contentType?.includes("application/json")
  ) {
    return undefined as T;
  }

  // Пытаемся распарсить JSON, если он есть
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  
  return JSON.parse(text) as T;
};

// ======================= Типы =======================
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  isTemporaryPassword?: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  position?: string;
  department_id?: string;
  city?: string;
  phone?: string;
  telegram?: string;
  mattermost?: string;
  bio?: string;
  birthday?: string;
  photo_url?: string;
  employee_status?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========== Forgot Password ==========
interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

// ========== Set Password ==========
interface SetPasswordRequest {
  token: string;
  newPassword: string;
}

interface SetPasswordResponse {
  success: boolean;
  message?: string;
}

// ======================= API =======================
export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, message: errorData.detail || "Ошибка входа" };
      }

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token || "");
      }

      return {
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        isTemporaryPassword: false,
        user: {
          id: data.user_id || data.user?.id || "",
          email: data.email || data.user?.email || "",
          name:
            data.name ||
            `${data.user?.first_name || ""} ${
              data.user?.last_name || ""
            }`.trim() ||
            "",
        },
      };
    } catch (error) {
      console.error("Login API error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    // Очищаем кеш фотографий при выходе
    clearPhotoCache();
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const userData = await jsonRequest<BackendUser>("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        id: userData.id || "",
        email: userData.email || "",
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        role: userData.role || "employee",
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      const resData = await jsonRequest<ForgotPasswordResponse>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return resData;
    } catch (error) {
      console.error("Forgot password API error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  },

  async setPassword(data: SetPasswordRequest): Promise<SetPasswordResponse> {
    try {
      const resData = await jsonRequest<SetPasswordResponse>(
        "/auth/set-password",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return resData;
    } catch (error) {
      console.error("Set password API error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  },

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{
    user_id: string | { toString(): string };
    access_token: string;
    refresh_token: string;
  }> {
    const response = await jsonRequest<{
      user_id: string | { toString(): string };
      access_token: string;
      refresh_token: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Преобразуем user_id в строку, если это необходимо
    if (response.user_id && typeof response.user_id !== "string") {
      response.user_id = String(response.user_id);
    }
    return response;
  },
};

type EmployeeListResponse = { items: Employee[] };

export const employeesAPI = {
  async list(params?: { search?: string; city?: string; skills?: string[] }) {
    let url: URL;

    // Если есть параметры поиска или фильтры, используем эндпоинт /search/
    const hasSearch = params?.search && params.search.trim();
    const hasFilters =
      params?.city || (params?.skills && params.skills.length > 0);

    if (hasSearch || hasFilters) {
      url = new URL(`${API_BASE_URL}/employees/search/`);
      // Если есть поисковый запрос, передаем его, иначе пустую строку
      url.searchParams.set("q", params?.search?.trim() || "");
      // Бэкенд ожидает cities как массив, передаем как массив
      if (params?.city) {
        url.searchParams.append("cities", params.city);
      }
      if (params?.skills && params.skills.length > 0) {
        params.skills.forEach((skill) =>
          url.searchParams.append("skills", skill)
        );
      }
    } else {
      // Иначе используем обычный эндпоинт /employees/
      url = new URL(`${API_BASE_URL}/employees/`);
    }

    if (import.meta.env.DEV) {
      console.log(`[API] Fetching employees from: ${url.toString()}`);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}: ${errorText}`);
      throw new Error(
        `Не удалось загрузить сотрудников: ${response.status} ${response.statusText}`
      );
    }

    // Бэкенд возвращает массив напрямую, а не объект с items
    const backendUsers = (await response.json()) as BackendUser[];
    const employees = backendUsers.map(mapBackendUserToEmployee);

    if (import.meta.env.DEV) {
      console.log(`[API] Loaded ${employees.length} employees`);
    }

    return employees;
  },

  /**
   * Поиск сотрудников по имени, фамилии, должности или email
   * @param params Параметры поиска
   * @param params.q Строка поиска (обязательный параметр)
   * @param params.cities Массив названий городов для фильтрации
   * @param params.departments Массив ID подразделений для фильтрации
   * @param params.legal_entities Массив ID юридических лиц для фильтрации
   * @param params.skills Массив названий навыков для фильтрации
   * @returns Список сотрудников, соответствующих критериям поиска
   */
  async search(params: {
    q: string;
    cities?: string[];
    departments?: string[];
    legal_entities?: string[];
    skills?: string[];
  }): Promise<Employee[]> {
    const url = new URL(`${API_BASE_URL}/employees/search/`);

    // Обязательный параметр q
    url.searchParams.set("q", params.q.trim());

    // Опциональные параметры
    if (params.cities && params.cities.length > 0) {
      params.cities.forEach((city) => url.searchParams.append("cities", city));
    }
    if (params.departments && params.departments.length > 0) {
      params.departments.forEach((dept) =>
        url.searchParams.append("departments", dept)
      );
    }
    if (params.legal_entities && params.legal_entities.length > 0) {
      params.legal_entities.forEach((entity) =>
        url.searchParams.append("legal_entities", entity)
      );
    }
    if (params.skills && params.skills.length > 0) {
      params.skills.forEach((skill) =>
        url.searchParams.append("skills", skill)
      );
    }

    if (import.meta.env.DEV) {
      console.log(`[API] Searching employees: ${url.toString()}`);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}: ${errorText}`);
      throw new Error(
        `Не удалось выполнить поиск: ${response.status} ${response.statusText}`
      );
    }

    const backendUsers = (await response.json()) as BackendUser[];
    const employees = backendUsers.map(mapBackendUserToEmployee);

    if (import.meta.env.DEV) {
      console.log(`[API] Found ${employees.length} employees`);
    }

    return employees;
  },

  async getById(id: string) {
    const backendUser = await jsonRequest<BackendUser>(`/employees/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    });
    return mapBackendUserToEmployee(backendUser);
  },

  async create(payload: Partial<Employee>) {
    const backendPayload = mapEmployeeToBackendUser(payload);
    const backendUser = await jsonRequest<BackendUser>(`/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: JSON.stringify(backendPayload),
    });
    return mapBackendUserToEmployee(backendUser);
  },

  async update(id: string, payload: Partial<Employee>) {
    // Если указано название отдела, но нет departmentId, пытаемся найти ID по названию
    if (payload.department && !payload.departmentId) {
      try {
        const departments = await departmentsAPI.list();
        const foundDepartment = departments.find(
          (dept) => dept.name === payload.department
        );
        if (foundDepartment) {
          payload.departmentId = foundDepartment.id;
        } else if (payload.department.trim()) {
          // Если отдел указан, но не найден в списке, выбрасываем ошибку
          throw new Error(
            `Подразделение "${payload.department}" не найдено. Пожалуйста, сначала создайте это подразделение или выберите существующее.`
          );
        }
      } catch (error) {
        // Если это наша ошибка о ненайденном отделе, пробрасываем её дальше
        if (error instanceof Error && error.message.includes("не найдено")) {
          throw error;
        }
        console.warn(
          "Не удалось загрузить список отделов для поиска ID:",
          error
        );
        // Если не удалось загрузить список отделов, но отдел указан, выбрасываем ошибку
        if (payload.department && payload.department.trim()) {
          throw new Error(
            "Не удалось загрузить список подразделений. Пожалуйста, попробуйте позже или убедитесь, что подразделение существует."
          );
        }
      }
    }

    const backendPayload = mapEmployeeToBackendUser(payload);

    // Убеждаемся, что отправляем валидный объект
    if (
      !backendPayload ||
      typeof backendPayload !== "object" ||
      Array.isArray(backendPayload)
    ) {
      throw new Error("Invalid payload: expected an object");
    }

    // Преобразуем в JSON строку
    const bodyString = JSON.stringify(backendPayload);

    // Проверяем, что получилась валидная JSON строка (не пустой объект и не null/undefined)
    if (
      !bodyString ||
      bodyString === "null" ||
      bodyString === "undefined" ||
      bodyString === "{}"
    ) {
      // Если payload пустой, отправляем пустой объект, но это может вызвать ошибку на бэкенде
      // Лучше выбросить ошибку, чтобы пользователь знал, что нечего обновлять
      throw new Error("No fields to update");
    }

    const backendUser = await jsonRequest<BackendUser>(`/employees/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: bodyString,
    });
    return mapBackendUserToEmployee(backendUser);
  },

  // Новый метод для обновления собственных данных сотрудником (PUT /employees/{id}/self)
  async updateSelf(id: string, payload: Partial<Employee>) {
    // Логика идентична `update`, только URL содержит `/self`
    // Если указано название отдела, но нет departmentId, пытаемся найти ID по названию
    if (payload.department && !payload.departmentId) {
      try {
        const departments = await departmentsAPI.list();
        const foundDepartment = departments.find(
          (dept) => dept.name === payload.department
        );
        if (foundDepartment) {
          payload.departmentId = foundDepartment.id;
        } else if (payload.department.trim()) {
          throw new Error(
            `Подразделение "${payload.department}" не найдено. Пожалуйста, сначала создайте это подразделение или выберите существующее.`
          );
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("не найдено")) {
          throw error;
        }
        console.warn(
          "Не удалось загрузить список отделов для поиска ID:",
          error
        );
        if (payload.department && payload.department.trim()) {
          throw new Error(
            "Не удалось загрузить список подразделений. Пожалуйста, попробуйте позже или убедитесь, что подразделение существует."
          );
        }
      }
    }

    const backendPayload = mapEmployeeToBackendUser(payload);

    if (
      !backendPayload ||
      typeof backendPayload !== "object" ||
      Array.isArray(backendPayload)
    ) {
      throw new Error("Invalid payload: expected an object");
    }

    const bodyString = JSON.stringify(backendPayload);

    if (
      !bodyString ||
      bodyString === "null" ||
      bodyString === "undefined" ||
      bodyString === "{}"
    ) {
      throw new Error("No fields to update");
    }

    const backendUser = await jsonRequest<BackendUser>(`/employees/${id}/self`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: bodyString,
    });
    return mapBackendUserToEmployee(backendUser);
  },

  async uploadAvatar(id: string, file: File, noModeration: boolean = false) {
    // Валидация размера файла на клиенте
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Размер файла не должен превышать 5MB");
    }

    // Валидация типа файла
    if (!file.type.startsWith("image/")) {
      throw new Error("Файл должен быть изображением");
    }

    if (!id) {
      throw new Error("ID пользователя не указан");
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Токен авторизации не найден");
    }

    const url = new URL(`${API_BASE_URL}/employees/${id}/avatar/upload`);
    // Добавляем параметр no_moderation только если явно указано true
    // Для обычных сотрудников (noModeration=false) параметр не добавляется,
    // что означает, что фото будет отправлено на модерацию
    if (noModeration) {
      url.searchParams.append("no_moderation", "true");
    }

    if (import.meta.env.DEV) {
      console.log(
        `[API] Uploading avatar for user ${id}, noModeration: ${noModeration}`
      );
      console.log(
        `[API] Photo will be ${
          noModeration ? "activated immediately" : "sent for moderation"
        }`
      );
      console.log(`[API] URL: ${url.toString()}`);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Не устанавливаем Content-Type для FormData, браузер сделает это автоматически с boundary
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Не удалось загрузить аватар";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        if ((import.meta as any).env?.DEV) {
          console.error(
            `[API] Avatar upload error (${response.status}):`,
            errorData
          );
        }
      } catch (parseError) {
        // Если не удалось распарсить JSON, используем текст ответа
        const text = await response.text().catch(() => "");
        if (text) {
          errorMessage = text;
        }
        if ((import.meta as any).env?.DEV) {
          console.error(
            `[API] Avatar upload error (${response.status}):`,
            text
          );
        }
      }
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    const s3Key = await response.json();
    // Возвращаем объект с photoUrl для совместимости с существующим кодом
    // s3Key - это строка, которую FastAPI автоматически сериализует в JSON
    const s3KeyString = typeof s3Key === "string" ? s3Key : String(s3Key);
    const photoPath = `/api/employees/avatars/${s3KeyString}`;
    const fullPhotoUrl = getPhotoUrl(photoPath) || photoPath;

    // Очищаем кеш для старого фото сотрудника (если оно было)
    // Получаем обновленные данные сотрудника, чтобы очистить кеш старого фото
    try {
      const refreshedEmployee = await this.getById(id);
      if (
        refreshedEmployee?.photoUrl &&
        refreshedEmployee.photoUrl !== fullPhotoUrl
      ) {
        clearPhotoFromCache(refreshedEmployee.photoUrl);
      }
    } catch (error) {
      // Игнорируем ошибку, если не удалось получить данные сотрудника
      console.warn("Не удалось очистить кеш старого фото:", error);
    }

    return { photoUrl: fullPhotoUrl };
  },

  async remove(id: string) {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Не удалось удалить сотрудника");
    }
    return true;
  },
};

export const filtersAPI = {
  async getOptions() {
    return jsonRequest<{
      cities: string[];
      skills: string[];
      legalEntities: string[];
      departments: string[];
      groups: string[];
      positions: string[];
    }>("/filters/options", { method: "GET" });
  },
};

export interface Department {
  id: string;
  name: string;
  legal_entity_id: string;
  parent_id: string | null;
  manager: {
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
    photo_url: string | null;
  } | null;
  employees: any[];
  created_at: string;
  updated_at: string;
}

export const departmentsAPI = {
  async list() {
    return jsonRequest<Department[]>("/departments/", { method: "GET" });
  },
  async create(data: {
    name: string;
    legal_entity_id: string;
    parent_id?: string | null;
  }) {
    return jsonRequest<Department>("/departments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(
    departmentId: string,
    data: {
      name?: string;
      parent_id?: string | null;
      manager_id?: string | null;
    }
  ) {
    return jsonRequest<Department>(`/departments/${departmentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export interface AvatarModerationRequest {
  id: string;
  user: BackendUser;
  url: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
}

/**
 * API для работы с модерацией аватаров
 * Используется HR и админами для получения и модерации фотографий сотрудников
 */
export const avatarsAPI = {
  /**
   * GET /api/employees/avatars/pending
   * Получить список аватаров, ожидающих модерации
   */
  async getPending() {
    return jsonRequest<AvatarModerationRequest[]>(
      "/employees/avatars/pending",
      { method: "GET" }
    );
  },
  /**
   * GET /api/employees/avatars/accepted
   * Получить список одобренных аватаров
   */
  async getAccepted() {
    return jsonRequest<AvatarModerationRequest[]>(
      "/employees/avatars/accepted",
      { method: "GET" }
    );
  },
  /**
   * GET /api/employees/avatars/rejected
   * Получить список отклоненных аватаров
   */
  async getRejected() {
    return jsonRequest<AvatarModerationRequest[]>(
      "/employees/avatars/rejected",
      { method: "GET" }
    );
  },
  /**
   * PUT /api/employees/avatars/{avatar_id}/moderate
   * Модерация аватара (одобрение или отклонение)
   * @param avatarId - ID аватара
   * @param status - Статус модерации: "ACCEPTED" (одобрено) или "REJECTED" (отклонено)
   * @param rejectionReason - Причина отклонения (опционально, только для статуса "REJECTED")
   */
  async moderate(
    avatarId: string,
    status: "ACCEPTED" | "REJECTED",
    rejectionReason?: string
  ) {
    return jsonRequest<string>(`/employees/avatars/${avatarId}/moderate`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        rejection_reason: rejectionReason || null,
      }),
    });
  },
};

// ======================= SKILLS API =======================
export interface Skill {
  id: string;
  name: string;
}

export const skillsAPI = {
  async list(): Promise<Skill[]> {
    return jsonRequest<Skill[]>("/skills/", { method: "GET" });
  },

  async create(name: string): Promise<Skill> {
    return jsonRequest<Skill>("/skills/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async setSkills(userId: string, skillNames: string[]): Promise<Employee> {
    console.log("setSkills вызван с:", { userId, skillNames });
    const requestBody = { skills: skillNames };
    console.log("Тело запроса:", JSON.stringify(requestBody));

    const backendUser = await jsonRequest<BackendUser>(
      `/employees/${userId}/set_skills`,
      {
        method: "PUT",
        body: JSON.stringify(requestBody),
      }
    );

    console.log("Ответ от бэкенда set_skills:", backendUser);
    console.log("Навыки в ответе:", backendUser.skills);

    const mappedEmployee = mapBackendUserToEmployee(backendUser);
    console.log("Маппированный сотрудник:", mappedEmployee);
    console.log("Навыки после маппинга:", mappedEmployee.skills);

    return mappedEmployee;
  },
};

// ======================= LEGAL ENTITIES API =======================
export interface DepartmentInLegalEntity {
  id: string;
  name: string;
  legal_entity_id: string;
  parent_id: string | null;
  manager: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  employees: any[];
  subdepartments?: DepartmentInLegalEntity[];
  created_at: string;
  updated_at: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  departments: DepartmentInLegalEntity[];
  created_at: string;
  updated_at: string;
}

export const legalEntitiesAPI = {
  /**
   * GET /api/legal-entities/
   * Получить список всех юридических лиц
   */
  async list(): Promise<LegalEntity[]> {
    return jsonRequest<LegalEntity[]>("/legal-entities/", {
      method: "GET",
    });
  },

  /**
   * POST /api/legal-entities/
   * Создать новое юридическое лицо
   * Доступно только для SYSTEM_ADMIN и HR_ADMIN
   */
  async create(name: string): Promise<LegalEntity> {
    return jsonRequest<LegalEntity>("/legal-entities/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  /**
   * PATCH /api/legal-entities/{le_id}
   * Обновить данные юридического лица
   * Доступно только для SYSTEM_ADMIN и HR_ADMIN
   */
  async update(leId: string, data: { name: string }): Promise<LegalEntity> {
    return jsonRequest<LegalEntity>(`/legal-entities/${leId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE /api/legal-entities/{le_id}
   * Удалить юридическое лицо
   * Доступно только для SYSTEM_ADMIN и HR_ADMIN
   */
  async delete(leId: string): Promise<void> {
    return jsonRequest<void>(`/legal-entities/${leId}`, {
      method: "DELETE",
    });
  },
};
