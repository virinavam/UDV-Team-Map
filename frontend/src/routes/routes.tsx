import React from "react";
import { RouteProps } from "react-router-dom";
import EmployeesPage from "../pages/EmployeesPage";
import TeamMapPage from "../pages/TeamMapPage";
import ProfilePage from "../pages/ProfilePage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminPanelPage from "../pages/AdminPanelPage";
import HRDataPage from "../pages/HRDataPage";
import AddEmployeePage from "../pages/AddEmployeePage";
import ModerationPage from "../pages/ModerationPage";
import LoginPage from "../pages/LoginPage";
import SetNewPasswordPage from "../pages/SetNewPasswordPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import { ROUTES } from "./paths";

export interface AppRoute extends Omit<RouteProps, "path" | "element"> {
  path: string;
  element: React.ReactElement;
  isProtected?: boolean;
  isPublic?: boolean;
}

// Публичные маршруты (не требуют аутентификации)
export const publicRoutes: AppRoute[] = [
  {
    path: ROUTES.login,
    element: <LoginPage />,
    isPublic: true,
  },
  {
    path: ROUTES.setPassword,
    element: <SetNewPasswordPage />,
    isPublic: true,
  },
  {
    path: ROUTES.forgotPassword,
    element: <ForgotPasswordPage />,
    isPublic: true,
  },
];

// Защищенные маршруты (требуют аутентификации)
export const protectedRoutes: AppRoute[] = [
  {
    path: ROUTES.employees,
    element: (
      <ProtectedRoute>
        <EmployeesPage />
      </ProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.teamMap,
    element: (
      <ProtectedRoute>
        <TeamMapPage />
      </ProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.profile,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.admin,
    element: (
      <RoleProtectedRoute allowedRoles={["SYSTEM_ADMIN", "HR_ADMIN"]}>
        <AdminDashboardPage />
      </RoleProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.adminPanel,
    element: (
      <RoleProtectedRoute allowedRoles={["SYSTEM_ADMIN", "HR_ADMIN"]}>
        <AdminPanelPage />
      </RoleProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.hrData,
    element: (
      <RoleProtectedRoute allowedRoles={["SYSTEM_ADMIN", "HR_ADMIN"]}>
        <HRDataPage />
      </RoleProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.addEmployee,
    element: (
      <RoleProtectedRoute allowedRoles={["SYSTEM_ADMIN", "HR_ADMIN"]}>
        <AddEmployeePage />
      </RoleProtectedRoute>
    ),
    isProtected: true,
  },
  {
    path: ROUTES.moderation,
    element: (
      <RoleProtectedRoute allowedRoles={["SYSTEM_ADMIN", "HR_ADMIN"]}>
        <ModerationPage />
      </RoleProtectedRoute>
    ),
    isProtected: true,
  },
];

// Все маршруты
export const allRoutes: AppRoute[] = [...publicRoutes, ...protectedRoutes];

