import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthScreen from "./components/auth/AuthScreen";
import EmployeesPage from "./pages/EmployeesPage";
import TeamMapPage from "./pages/TeamMapPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import HRDataPage from "./pages/HRDataPage";
import { authAPI } from "./lib/api";
import { Spinner, Center } from "@chakra-ui/react";

function ProtectedRoute({ element, isAuthenticated, isLoading }) {
  if (isLoading) {
    return (
      <Center h="100vh" w="100vw">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }
  return isAuthenticated ? element : <Navigate to="/" replace />;
}

export default function App() {
  console.log("App mounted");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // аутентификация отключена
  const [isLoading, setIsLoading] = useState(false); // и загрузка отключена

  useEffect(() => {
    console.log("useEffect fired");
    // Аутентификация отключена — этот блок при желании можно вернуть
    /*
    (async () => {
      setIsLoading(true);
      try {
        const user = await authAPI.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!user);
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
    */
  }, []);

  const handleAuthenticated = () => {
    console.log("Пользователь вошёл!");
    setIsAuthenticated(true);
  };

  return (
    <>
      {/*Блок с аутентификацией — выключен
      <Routes>
        <Route
          path="/"
          element={
            isLoading ? (
              <Center h="100vh" w="100vw">
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : isAuthenticated ? (
              <Navigate to="/employees" replace />
            ) : (
              <AuthScreen onAuthenticated={handleAuthenticated} />
            )
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute
              element={<EmployeesPage />}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/team-map"
          element={
            <ProtectedRoute
              element={<TeamMapPage />}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute
              element={<ProfilePage />}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              element={<AdminDashboardPage />}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/hr-data"
          element={
            <ProtectedRoute
              element={<HRDataPage />}
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
            />
          }
        />
      </Routes>
      */}

      {/* Оставляем только маршруты без аутентификации */}
      <Routes>
        <Route path="/" element={<Navigate to="/employees" replace />} />

        <Route path="/employees" element={<EmployeesPage />} />

        <Route path="/team-map" element={<TeamMapPage />} />

        <Route path="/profile/:id" element={<ProfilePage />} />

        <Route path="/admin" element={<AdminDashboardPage />} />

        <Route path="/hr-data" element={<HRDataPage />} />
      </Routes>
    </>
  );
}
