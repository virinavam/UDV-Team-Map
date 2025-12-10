/**
 * MSW (Mock Service Worker) Handlers
 *
 * Этот файл содержит все handlers для мокирования API эндпоинтов.
 * MSW перехватывает HTTP запросы и возвращает мокированные ответы,
 * что позволяет разрабатывать фронтенд без зависимости от реального бэкенда.
 *
 * ВАЖНО: Безопасность данных
 * - Чувствительные данные (salary, contractNumber, hireDate) автоматически
 *   удаляются из ответов API через sanitize-employee.ts
 * - Моки не попадают в production бандл благодаря динамическому импорту
 *   в main.jsx и конфигурации Vite
 * - В production эти handlers не используются, данные приходят с реального бэкенда
 *
 * Все handlers используют паттерн MSW:
 * - http.get/post/patch/delete() для определения методов
 * - HttpResponse.json() для формирования ответов
 * - delay() для имитации сетевой задержки
 * - sanitizeEmployee/sanitizeEmployees() для удаления чувствительных данных
 */

import { http, HttpResponse } from "msw";
import {
  employeesDb,
  findEmployeeById,
  upsertEmployee,
  deleteEmployee,
} from "./data/employees";
import { orgTree } from "./data/orgTree";
import { searchEmployees } from "../lib/search-utils";
import { sanitizeEmployees, sanitizeEmployee } from "../lib/sanitize-employee";
import type { Employee } from "../types/types";

/**
 * Имитация сетевой задержки
 * @param ms - задержка в миллисекундах
 */
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Мок токен для аутентификации
 */
const AUTH_TOKEN = "mock-access-token";

/**
 * Мок пользователя для аутентификации
 */
const mockUser = {
  id: "u-1",
  email: "admin@udvteam.map",
  first_name: "Ольга",
  last_name: "Лебедева",
  role: "admin",
  position: "HR Partner",
  city: "Екатеринбург",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Вспомогательная функция для возврата ошибки 401 Unauthorized
 */
const unauthorized = () =>
  HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });

/**
 * ========================
 * AUTH HANDLERS
 * ========================
 */

const authHandlers = [
  /**
   * POST /api/auth/login
   * Аутентификация пользователя
   */
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { success: false, message: "Введите email и пароль" },
        { status: 400 }
      );
    }
    await delay();
    return HttpResponse.json({
      success: true,
      access_token: AUTH_TOKEN,
      refresh_token: "mock-refresh-token",
      isTemporaryPassword: false,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: `${mockUser.first_name} ${mockUser.last_name}`,
      },
    });
  }),

  http.get("*/auth/me", async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${AUTH_TOKEN}`) {
      return unauthorized();
    }
    await delay(250);
    return HttpResponse.json(mockUser);
  }),

  http.post("*/auth/forgot-password", async () => {
    await delay();
    return HttpResponse.json({
      success: true,
      message: "Ссылка для восстановления отправлена",
    });
  }),

  /**
   * POST /api/auth/set-password
   * Установка нового пароля
   */
  http.post("*/auth/set-password", async () => {
    await delay();
    return HttpResponse.json({
      success: true,
      message: "Пароль успешно обновлен",
    });
  }),
];

/**
 * ========================
 * EMPLOYEES HANDLERS
 * ========================
 */

const employeesHandlers = [
  /**
   * GET /api/employees
   * Получение списка сотрудников с поддержкой фильтрации и поиска
   */
  http.get("*/employees", async ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const city = url.searchParams.get("city");
    const skills = url.searchParams.getAll("skills");

    let result = [...employeesDb];

    // Используем новую универсальную логику поиска с fuzzy matching
    if (search) {
      result = searchEmployees(result, search, {
        fuzzyThreshold: 0.5,
        matchAllTokens: false, // хотя бы один токен должен совпасть
      });
    }

    if (city) {
      result = result.filter((employee) => employee.city === city);
    }

    if (skills.length) {
      result = result.filter((employee) =>
        skills.some((skill) => employee.skills.includes(skill))
      );
    }

    await delay(50);
    // Удаляем чувствительные данные перед отправкой на клиент
    const sanitized = sanitizeEmployees(result);
    return HttpResponse.json({ items: sanitized });
  }),

  /**
   * GET /api/employees/:id
   * Получение сотрудника по ID
   * ВАЖНО: Чувствительные данные (salary, contractNumber) удаляются перед отправкой
   */
  http.get("*/employees/:id", async ({ request, params }) => {
    const employee = findEmployeeById(params.id as string);
    if (!employee) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }
    await delay(150);

    // Проверяем роль пользователя из токена (в реальном приложении)
    // Для моков всегда удаляем чувствительные данные
    const sanitized = sanitizeEmployee(employee);
    return HttpResponse.json(sanitized);
  }),

  /**
   * POST /api/employees
   * Создание нового сотрудника
   */
  http.post("*/employees", async ({ request }) => {
    const payload = (await request.json()) as Partial<Employee>;

    // Генерируем новый ID для сотрудника
    const newId = `e${Date.now()}`;

    // Создаем нового сотрудника с обязательными полями
    const newEmployee: Employee = {
      id: newId,
      name:
        payload.name ||
        `${payload.lastName || ""} ${payload.firstName || ""}`.trim() ||
        "Новый сотрудник",
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      status: payload.status || "Активен",
      email: payload.email || "",
      position: payload.position || "",
      city: payload.city || "",
      location: payload.location || payload.city || "",
      skills: payload.skills || [],
      photoUrl: payload.photoUrl || "/placeholder.svg",
      legalEntity: payload.legalEntity || "",
      departmentFull: payload.departmentFull || "",
      hireDate: payload.hireDate || new Date().toLocaleDateString("ru-RU"),
      salary: payload.salary || 0,
      mattermost: payload.mattermost,
      telegram: payload.telegram,
      employmentStatus: payload.employmentStatus || "Работает",
      contractNumber: payload.contractNumber,
      ...payload,
    };

    const created = upsertEmployee(newEmployee);
    await delay(200);
    // Удаляем чувствительные данные перед отправкой на клиент
    const sanitized = sanitizeEmployee(created);
    return HttpResponse.json(sanitized, { status: 201 });
  }),

  /**
   * PATCH /api/employees/:id
   * Обновление данных сотрудника
   */
  http.patch("*/employees/:id", async ({ params, request }) => {
    const id = params.id as string;
    const payload = (await request.json()) as Record<string, unknown>;
    const existing = findEmployeeById(id);
    if (!existing) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }
    const updated = upsertEmployee({ ...existing, ...payload });
    await delay(200);
    // Удаляем чувствительные данные перед отправкой на клиент
    const sanitized = sanitizeEmployee(updated);
    return HttpResponse.json(sanitized);
  }),

  /**
   * POST /api/employees/:id/avatar
   * Загрузка аватара сотрудника
   */
  http.post("*/employees/:id/avatar", async ({ params, request }) => {
    const id = params.id as string;
    const existing = findEmployeeById(id);
    if (!existing) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    try {
      const formData = await request.formData();
      const file = formData.get("avatar");

      if (!file || !(file instanceof File)) {
        return HttpResponse.json(
          { message: "Файл не найден" },
          { status: 400 }
        );
      }

      // Валидация типа файла
      if (!file.type.startsWith("image/")) {
        return HttpResponse.json(
          { message: "Файл должен быть изображением" },
          { status: 400 }
        );
      }

      // Валидация размера файла (максимум 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        return HttpResponse.json(
          { message: "Размер файла не должен превышать 5MB" },
          { status: 400 }
        );
      }

      // Конвертируем файл в base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...Array.from(new Uint8Array(buffer)))
      );
      const photoUrl = `data:${file.type};base64,${base64}`;

      // Обновляем сотрудника с новым фото
      const updated = upsertEmployee({ ...existing, photoUrl });

      // Имитация загрузки файла
      await delay(300);

      return HttpResponse.json({ photoUrl: updated.photoUrl });
    } catch (error) {
      return HttpResponse.json(
        { message: "Ошибка при загрузке файла" },
        { status: 500 }
      );
    }
  }),

  /**
   * DELETE /api/employees/:id
   * Удаление сотрудника
   */
  http.delete("*/employees/:id", async ({ params }) => {
    const id = params.id as string;
    const deleted = deleteEmployee(id);
    await delay(150);
    if (!deleted) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true });
  }),
];

/**
 * ========================
 * FILTERS HANDLERS
 * ========================
 */

const filtersHandlers = [
  /**
   * GET /api/filters/options
   * Получение опций для фильтров (города, навыки, юридические лица и т.д.)
   */
  http.get("*/filters/options", async () => {
    const unique = <T>(items: (T | undefined | null)[]) =>
      Array.from(new Set(items.filter(Boolean) as T[]));
    await delay(120);
    return HttpResponse.json({
      cities: unique(employeesDb.map((emp) => emp.city)).sort(),
      skills: unique(employeesDb.flatMap((emp) => emp.skills)).sort(),
      legalEntities: unique(
        employeesDb.map(
          (emp) => emp.legalEntity || emp.departmentFull?.split(" / ")[0]
        )
      ).sort(),
      departments: unique(
        employeesDb.map(
          (emp) => emp.departmentFull?.split(" / ")[2] || emp.department
        )
      ).sort(),
      groups: unique(employeesDb.map((emp) => emp.group)).sort(),
      positions: unique(employeesDb.map((emp) => emp.position)).sort(),
    });
  }),
];

/**
 * ========================
 * ORGANIZATION HANDLERS
 * ========================
 */

const organizationHandlers = [
  /**
   * GET /api/org-tree
   * Получение организационной структуры
   */
  http.get("*/org-tree", async () => {
    await delay(50);
    return HttpResponse.json({ tree: orgTree });
  }),
];

/**
 * ========================
 * EXPORT ALL HANDLERS
 * ========================
 *
 * Все handlers объединены в один массив для использования в MSW worker
 */
export const handlers = [
  ...authHandlers,
  ...employeesHandlers,
  ...filtersHandlers,
  ...organizationHandlers,
];
