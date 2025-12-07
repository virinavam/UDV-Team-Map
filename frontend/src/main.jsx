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
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
    } catch (error) {
      console.warn("Failed to start MSW worker:", error);
    }
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
