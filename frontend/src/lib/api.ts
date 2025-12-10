import type { Employee, OrgNode } from "../types/types";
import {
  mapBackendUserToEmployee,
  mapEmployeeToBackendUser,
  type BackendUser,
} from "./api-mapper";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Добавляем токен авторизации, если он есть и не был передан явно
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(message?.detail || message?.message || "Request failed");
  }

  return (await response.json()) as T;
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
      if (params?.city) url.searchParams.set("city", params.city);
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
    const backendPayload = mapEmployeeToBackendUser(payload);
    const backendUser = await jsonRequest<BackendUser>(`/employees/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: JSON.stringify(backendPayload),
    });
    return mapBackendUserToEmployee(backendUser);
  },

  async uploadAvatar(id: string, file: File) {
    // Валидация размера файла на клиенте
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Размер файла не должен превышать 5MB");
    }

    // Валидация типа файла
    if (!file.type.startsWith("image/")) {
      throw new Error("Файл должен быть изображением");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/employees/${id}/avatar`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Не удалось загрузить аватар");
    }

    return (await response.json()) as { photoUrl: string };
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

export const orgAPI = {
  async getTree() {
    return jsonRequest<{ tree: OrgNode[] }>("/org-tree", { method: "GET" });
  },
};
