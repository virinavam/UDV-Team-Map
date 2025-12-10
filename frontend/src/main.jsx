import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}
const root = ReactDOM.createRoot(rootElement);

const enableMocking = async () => {
  // MSW и мок-данные загружаются только в development режиме
  // В production они не попадают в бандл благодаря условию и динамическому импорту
  
  // Проверяем переменную окружения для управления MSW
  // VITE_USE_MSW=true (по умолчанию в DEV) - использовать моки
  // VITE_USE_MSW=false - использовать реальный бэкенд
  const shouldUseMSW = 
    import.meta.env.DEV && 
    import.meta.env.VITE_USE_MSW !== 'false';
  
  if (shouldUseMSW) {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({
        onUnhandledRequest: (request, print) => {
          const url = new URL(request.url);
          
          // Игнорируем статические файлы
          const isStaticFile = /\.(svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js|map)$/i.test(url.pathname);
          
          // Игнорируем навигационные запросы к маршрутам приложения (не API)
          // API запросы начинаются с /api, остальные - это маршруты приложения
          const isApiRequest = url.pathname.startsWith('/api');
          const isAppRoute = !isApiRequest && !isStaticFile;
          
          // Показываем предупреждение только для необработанных API запросов
          if (isApiRequest && !isStaticFile) {
            print.warning();
          }
        },
      });
      console.log('[MSW] ✅ Mock Service Worker enabled - using mock data');
    } catch (error) {
      console.warn("Failed to start MSW worker:", error);
    }
  } else {
    console.log('[MSW] ⏭️  Mock Service Worker disabled - using real backend API');
  }
};

const renderApp = () => {
  const DevTools = import.meta.env.DEV
    ? React.lazy(() =>
        import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      )
    : null;

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ChakraProvider>
          {DevTools && (
            <React.Suspense fallback={null}>
              <DevTools initialIsOpen={false} />
            </React.Suspense>
          )}
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

enableMocking().then(renderApp);
