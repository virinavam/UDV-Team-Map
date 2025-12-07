import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import EmployeesPage from "./pages/EmployeesPage";
import TeamMapPage from "./pages/TeamMapPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import HRDataPage from "./pages/HRDataPage";
import LoginPage from "./pages/LoginPage";
import SetNewPasswordPage from "./pages/SetNewPasswordPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { ROUTES } from "./routes/paths";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

const LoadingFallback = () => (
  <Center h="100vh" w="100vw">
    <Spinner size="lg" color="purple.500" />
  </Center>
);

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.setPassword} element={<SetNewPasswordPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />

        <Route
          path={ROUTES.employees}
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.teamMap}
          element={
            <ProtectedRoute>
              <TeamMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.admin}
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.adminPanel}
          element={
            <ProtectedRoute>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.hrData}
          element={
            <ProtectedRoute>
              <HRDataPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.root}
          element={
            <Navigate
              to={isAuthenticated ? ROUTES.employees : ROUTES.login}
              replace
            />
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.root} replace />} />
      </Routes>
    </Suspense>
  );
}
