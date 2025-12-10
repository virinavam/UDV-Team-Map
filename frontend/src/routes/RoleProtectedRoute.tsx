import React from "react";
import { Navigate } from "react-router-dom";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "./paths";

interface RoleProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[]; // Роли, которым разрешен доступ
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Пока идет проверка сессии, показываем загрузку
  if (isLoading) {
    return (
      <Center h="100vh" w="100vw">
        <Spinner size="lg" color="purple.500" />
      </Center>
    );
  }

  // Если пользователь не аутентифицирован, редиректим на страницу входа
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Проверяем роль пользователя
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Center h="100vh" w="100vw">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold" color="red.500">
            Доступ запрещен
          </Text>
          <Text color="gray.600">
            У вас нет прав для доступа к этой странице
          </Text>
        </VStack>
      </Center>
    );
  }

  return children;
};

export default RoleProtectedRoute;


