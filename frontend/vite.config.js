import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
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
          if (isProduction) {
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
        // Дополнительная защита: исключаем моки из бандла через treeshaking
        output: {
          // Убеждаемся, что моки не попадают в бандл
          manualChunks: (id) => {
            // В production выносим моки в отдельный чанк, который будет исключен
            if (
              isProduction &&
              (id.includes("/mocks/") || id.includes("\\mocks\\"))
            ) {
              // Возвращаем null, чтобы исключить из бандла
              return null;
            }
          },
        },
      },
      // Дополнительная защита: исключаем моки из анализа зависимостей
      commonjsOptions: {
        exclude: isProduction ? [/mocks/, /msw/] : [],
      },
    },
    // Исключаем моки из оптимизации зависимостей в production
    optimizeDeps: {
      exclude: isProduction ? ["msw", /mocks/] : [],
    },
    // Дополнительная защита: исключаем моки из резолва модулей
    resolve: {
      alias: isProduction
        ? {
            // В production заменяем импорты моков на пустые модули
            "@/mocks": false,
          }
        : {},
    },
  };
});
