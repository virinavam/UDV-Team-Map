import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// Логирование для отладки
if (import.meta.env.DEV) {
  worker.events.on("request:start", ({ request }) => {
    // Игнорируем статические файлы (SVG, изображения и т.д.)
    const url = new URL(request.url);
    const isStaticFile =
      /\.(svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js)$/i.test(
        url.pathname
      );
    if (!isStaticFile) {
      console.log(`[MSW] ${request.method} ${request.url}`);
    }
  });
  worker.events.on("request:match", ({ request }) => {
    console.log(`[MSW] ✓ Matched: ${request.method} ${request.url}`);
  });
  worker.events.on("request:unhandled", ({ request }) => {
    const url = new URL(request.url);

    // Игнорируем статические файлы
    const isStaticFile =
      /\.(svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js|map)$/i.test(
        url.pathname
      );

    // Игнорируем навигационные запросы к маршрутам приложения (не API)
    // API запросы начинаются с /api, остальные - это маршруты приложения
    const isApiRequest = url.pathname.startsWith("/api");
    const isAppRoute = !isApiRequest && !isStaticFile;

    // Показываем предупреждение только для необработанных API запросов
    if (isApiRequest && !isStaticFile) {
      console.warn(`[MSW] ✗ Unhandled: ${request.method} ${request.url}`);
    }
  });
}
