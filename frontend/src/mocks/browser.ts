import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// Логирование для отладки
if (import.meta.env.DEV) {
  worker.events.on("request:start", ({ request }) => {
    console.log(`[MSW] ${request.method} ${request.url}`);
  });
  worker.events.on("request:match", ({ request }) => {
    console.log(`[MSW] ✓ Matched: ${request.method} ${request.url}`);
  });
  worker.events.on("request:unhandled", ({ request }) => {
    console.warn(`[MSW] ✗ Unhandled: ${request.method} ${request.url}`);
  });
}
