# MSW (Mock Service Worker) Handlers

Этот файл содержит документацию по использованию MSW (Mock Service Worker) в проекте.

## Что такое MSW?

Mock Service Worker (MSW) — мощный инструмент для фронтенд-разработки, который позволяет имитировать (мокать) бэкенд API, создавая фейковые ответы и эмулируя поведение сервера для изоляции и тестирования фронтенда без зависимости от реального бэкенда.

## Структура handlers

Все handlers находятся в файле `handlers.ts` и разделены на категории:

### 1. Auth Handlers

- `POST /api/auth/login` - Аутентификация пользователя
- `GET /api/auth/me` - Получение текущего пользователя
- `POST /api/auth/forgot-password` - Восстановление пароля
- `POST /api/auth/set-password` - Установка нового пароля

### 2. Employees Handlers

- `GET /api/employees` - Получение списка сотрудников (с поиском и фильтрацией)
- `GET /api/employees/:id` - Получение сотрудника по ID
- `POST /api/employees` - Создание нового сотрудника
- `PATCH /api/employees/:id` - Обновление сотрудника
- `POST /api/employees/:id/avatar` - Загрузка аватара
- `DELETE /api/employees/:id` - Удаление сотрудника

### 3. Filters Handlers

- `GET /api/filters/options` - Получение опций для фильтров (города, навыки и т.д.)

### 4. Organization Handlers

- `GET /api/org-tree` - Получение организационной структуры

## Безопасность данных

**ВАЖНО:** Чувствительные данные автоматически удаляются из ответов API:

- `salary` (оклад)
- `contractNumber` (номер договора)
- `hireDate` (дата найма)

Эти поля удаляются через функции `sanitizeEmployee()` и `sanitizeEmployees()` из `lib/sanitize-employee.ts`.

### Исключение из production бандла

Моки не попадают в production бандл благодаря:

1. **Динамическому импорту** в `main.jsx`:

   ```javascript
   if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW !== "false") {
     const { worker } = await import("./mocks/browser");
     await worker.start();
   }
   ```

2. **Конфигурации Vite** в `vite.config.js`:

   - Использование `mode === "production"` для проверки окружения
   - `rollupOptions` для исключения mock файлов из бандла
   - `external` для предотвращения включения `msw` в production

3. **Переменной окружения** `VITE_USE_MSW`:
   - Можно отключить MSW даже в development, установив `VITE_USE_MSW=false`

### В production

В production эти handlers не используются, данные приходят с реального бэкенда через API.

## Использование

### Включение MSW

MSW автоматически включается в development режиме, если:

- `import.meta.env.DEV === true`
- `import.meta.env.VITE_USE_MSW !== 'false'`

### Отключение MSW

Чтобы отключить MSW, установите в `.env`:

```
VITE_USE_MSW=false
```

Или используйте реальный бэкенд, установив:

```
VITE_API_URL=http://localhost:8000
```

## Паттерны использования

Все handlers используют стандартный паттерн MSW:

```typescript
http.get("*/api/endpoint", async ({ request, params }) => {
  // Логика обработки запроса
  await delay(100); // Имитация сетевой задержки
  return HttpResponse.json({ data: ... });
});
```

### Основные функции

- `http.get/post/patch/delete()` - определение HTTP методов
- `HttpResponse.json()` - формирование JSON ответов
- `delay()` - имитация сетевой задержки
- `sanitizeEmployee()` / `sanitizeEmployees()` - удаление чувствительных данных

## Отладка

В development режиме MSW логирует все перехваченные запросы в консоль браузера:

```
[MSW] GET http://localhost:5173/api/employees
[MSW] ✓ Matched: GET http://localhost:5173/api/employees
```

Статические файлы (SVG, PNG, JPG и т.д.) автоматически игнорируются, чтобы не засорять консоль.
