import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "./context/AuthContext";
import { ROUTES } from "./routes/paths";
import { allRoutes } from "./routes/routes";

const LoadingFallback = () => (
  <Center h="100vh" w="100vw">
    <Spinner size="lg" color="purple.500" />
  </Center>
);

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Пока идет проверка сессии, показываем загрузку
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Рендерим все маршруты из конфигурации */}
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Корневой маршрут - редирект */}
        <Route
          path={ROUTES.root}
          element={
            <Navigate
              to={isAuthenticated ? ROUTES.employees : ROUTES.login}
              replace
            />
          }
        />

        {/* 404 - редирект на корень */}
        <Route path="*" element={<Navigate to={ROUTES.root} replace />} />
      </Routes>
    </Suspense>
  );
}
