import type { Employee, OrgNode } from "../types/types";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
          id: data.user_id,
          email: data.email,
          name: data.name || "",
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

      return await jsonRequest<User>("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    const url = new URL(`${API_BASE_URL}/employees`);
    if (params?.search) url.searchParams.set("search", params.search);
    if (params?.city) url.searchParams.set("city", params.city);
    params?.skills?.forEach((skill) =>
      url.searchParams.append("skills", skill)
    );

    if (import.meta.env.DEV) {
      console.log(`[API] Fetching employees from: ${url.toString()}`);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}: ${errorText}`);
      throw new Error(
        `Не удалось загрузить сотрудников: ${response.status} ${response.statusText}`
      );
    }
    const data = (await response.json()) as EmployeeListResponse;

    if (import.meta.env.DEV) {
      console.log(`[API] Loaded ${data.items.length} employees`);
    }

    return data.items;
  },

  async getById(id: string) {
    return jsonRequest<Employee>(`/employees/${id}`, { method: "GET" });
  },

  async update(id: string, payload: Partial<Employee>) {
    return jsonRequest<Employee>(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async uploadAvatar(id: string, file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await fetch(`${API_BASE_URL}/employees/${id}/avatar`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Не удалось загрузить аватар");
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
