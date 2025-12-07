import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ViewIcon, AtSignIcon } from "@chakra-ui/icons";
import { authAPI, employeesAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes/paths";
import { useQuery } from "@tanstack/react-query";

interface MainLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    key: "team-map",
    label: "Team Map",
    path: ROUTES.teamMap,
    icon: <Text fontSize="lg">🌐</Text>,
  },
  {
    key: "employees",
    label: "Сотрудники",
    path: ROUTES.employees,
    icon: <Text fontSize="lg">👥</Text>,
  },
  {
    key: "admin-panel",
    label: "Админ-панель",
    path: ROUTES.adminPanel,
    icon: <ViewIcon boxSize={4} />,
  },
  {
    key: "hr-data",
    label: "Кадровые данные",
    path: ROUTES.hrData,
    icon: <AtSignIcon boxSize={4} />,
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const activeColor = "#763186";
  const inactiveColor = useColorModeValue("gray.500", "gray.400");

  // Найти ID сотрудника по email пользователя
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["current-user-employee", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const employees = await employeesAPI.list();
      return employees.find((emp) => emp.email === user.email) || null;
    },
    enabled: Boolean(user?.email),
  });

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleProfileClick = () => {
    if (currentUserEmployee?.id) {
      navigate(`${ROUTES.profileBase}/${currentUserEmployee.id}`);
    }
  };

  const isActive = (path: string) => {
    if (path === ROUTES.teamMap) {
      return location.pathname === ROUTES.teamMap;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    navigate(ROUTES.login);
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box
        as="header"
        w="100%"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={6}
        py={4}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={6} align="center">
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              UDV Team Map
            </Text>

            {/* Navigation Links */}
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Box
                  key={item.key}
                  as="button"
                  onClick={() => handleNavigate(item.path)}
                  position="relative"
                  pb={2}
                  px={3}
                  py={1}
                  borderRadius="md"
                  bg={active ? "purple.50" : "transparent"}
                  _hover={{
                    color: activeColor,
                    bg: active ? "purple.50" : "gray.50",
                  }}
                  color={active ? activeColor : inactiveColor}
                  fontWeight={active ? "semibold" : "normal"}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <HStack spacing={2}>
                    {item.icon}
                    <Text>{item.label}</Text>
                  </HStack>
                  {active && (
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      h="2px"
                      bg={activeColor}
                    />
                  )}
                </Box>
              );
            })}
          </HStack>

          {/* User Profile */}
          <HStack spacing={3}>
            <Avatar
              size="sm"
              name={user ? `${user.first_name} ${user.last_name}` : "Профиль"}
              src={user?.photo_url || currentUserEmployee?.photoUrl}
            />
            <Text
              color={activeColor}
              fontWeight="medium"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={handleProfileClick}
            >
              {user ? `${user.first_name} ${user.last_name}` : "—"}
            </Text>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Выйти
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box>{children}</Box>
    </Box>
  );
};

export default MainLayout;
