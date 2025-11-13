// lib/api.ts
const API_BASE_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:8000/api";

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

interface User {
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

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) await this.logout();
        return null;
      }

      return (await response.json()) as User;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok)
        return { success: false, message: resData.message || "Ошибка" };

      return { success: true, message: resData.message || "Письмо отправлено" };
    } catch (error) {
      console.error("Forgot password API error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  },

  async setPassword(data: SetPasswordRequest): Promise<SetPasswordResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok)
        return { success: false, message: resData.message || "Ошибка" };

      return {
        success: true,
        message: resData.message || "Пароль успешно изменен",
      };
    } catch (error) {
      console.error("Set password API error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  },
};
