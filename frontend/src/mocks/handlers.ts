import { http, HttpResponse } from "msw";
import {
  employeesDb,
  findEmployeeById,
  upsertEmployee,
  deleteEmployee,
} from "./data/employees";
import { orgTree } from "./data/orgTree";

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const AUTH_TOKEN = "mock-access-token";
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

const unauthorized = () =>
  HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });

export const handlers = [
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
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

  http.post("*/auth/set-password", async () => {
    await delay();
    return HttpResponse.json({
      success: true,
      message: "Пароль успешно обновлен",
    });
  }),

  http.get("*/employees", async ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const city = url.searchParams.get("city");
    const skills = url.searchParams.getAll("skills");

    let result = [...employeesDb];

    if (search) {
      result = result.filter((employee) => {
        const searchable = `${employee.name} ${employee.position} ${employee.email}`.toLowerCase();
        return search
          .split(" ")
          .filter(Boolean)
          .every((word) => searchable.includes(word));
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

    await delay(150);
    return HttpResponse.json({ items: result });
  }),

  http.get("*/employees/:id", async ({ params }) => {
    const employee = findEmployeeById(params.id as string);
    if (!employee) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }
    await delay(150);
    return HttpResponse.json(employee);
  }),

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
    return HttpResponse.json(updated);
  }),

  http.post("*/employees/:id/avatar", async ({ params, request }) => {
    const id = params.id as string;
    const existing = findEmployeeById(id);
    if (!existing) {
      return HttpResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      return HttpResponse.json(
        { message: "Файл не найден" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...Array.from(new Uint8Array(buffer)))
    );
    const photoUrl = `data:${file.type};base64,${base64}`;
    const updated = upsertEmployee({ ...existing, photoUrl });
    await delay(200);
    return HttpResponse.json({ photoUrl: updated.photoUrl });
  }),

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

  http.get("*/filters/options", async () => {
    const unique = <T>(items: (T | undefined | null)[]) =>
      Array.from(new Set(items.filter(Boolean) as T[]));
    await delay(120);
    return HttpResponse.json({
      cities: unique(employeesDb.map((emp) => emp.city)).sort(),
      skills: unique(employeesDb.flatMap((emp) => emp.skills)).sort(),
      legalEntities: unique(
        employeesDb.map((emp) => emp.legalEntity || emp.departmentFull?.split(" / ")[0])
      ).sort(),
      departments: unique(
        employeesDb.map((emp) => emp.departmentFull?.split(" / ")[2] || emp.department)
      ).sort(),
      groups: unique(employeesDb.map((emp) => emp.group)).sort(),
      positions: unique(employeesDb.map((emp) => emp.position)).sort(),
    });
  }),

  http.get("*/org-tree", async () => {
    await delay(120);
    return HttpResponse.json({ tree: orgTree });
  }),
];

