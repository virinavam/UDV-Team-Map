import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    __API_URL__: JSON.stringify(
      process.env.VITE_API_URL || "http://localhost:8000/api"
    ),
  },
  build: {
    // Исключаем моки и тесты из production бандла
    rollupOptions: {
      // Используем resolve для исключения моков и тестов в production
      external: (id) => {
        // В production моки и тесты не должны попадать в бандл
        // Они загружаются только через динамический импорт в DEV режиме
        if (process.env.NODE_ENV === "production") {
          if (
            id.includes("/mocks/") ||
            id.includes("\\mocks\\") ||
            id.includes("msw") ||
            id.includes(".test.") ||
            id.includes(".spec.")
          ) {
            return true;
          }
        }
        return false;
      },
    },
  },
  // Исключаем моки из оптимизации зависимостей в production
  optimizeDeps: {
    exclude: process.env.NODE_ENV === "production" ? ["msw"] : [],
  },
});
