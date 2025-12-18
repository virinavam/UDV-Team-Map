import React, { useEffect, useState, useMemo } from "react";
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
import { Image } from "@chakra-ui/react";

// SVG иконки для навигации
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// Иконка админ-панели из файла с поддержкой цвета
const SettingsIcon = ({ color }: { color?: string }) => {
  const isActive = color === "#763186";
  return (
    <Box
      as="img"
      src="/admin.svg"
      alt="Admin Panel"
      boxSize="16px"
      sx={{
        filter: isActive
          ? "none"
          : "brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg)",
        transition: "filter 0.2s",
      }}
    />
  );
};

// Иконка модерации из файла с поддержкой цвета
const ImageIcon = ({ color }: { color?: string }) => {
  const isActive = color === "#763186";
  return (
    <Box
      as="img"
      src="/photo.svg"
      alt="Moderation"
      boxSize="16px"
      sx={{
        filter: isActive
          ? "none"
          : "brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg)",
        transition: "filter 0.2s",
      }}
    />
  );
};
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
  roles?: string[]; // Роли, которым доступен этот пункт меню
};

// Все возможные пункты навигации
const allNavItems: NavItem[] = [
  {
    key: "team-map",
    label: "Team Map",
    path: ROUTES.teamMap,
    icon: <Box as={GlobeIcon} />,
    // Доступно всем авторизованным пользователям
    roles: ["EMPLOYEE", "HR_ADMIN", "SYSTEM_ADMIN"],
  },
  {
    key: "employees",
    label: "Сотрудники",
    path: ROUTES.employees,
    icon: <Box as={PeopleIcon} />,
    // Доступно всем авторизованным пользователям
    roles: ["EMPLOYEE", "HR_ADMIN", "SYSTEM_ADMIN"],
  },
  {
    key: "admin-panel",
    label: "Админ-панель",
    path: ROUTES.adminPanel,
    icon: <Box as={SettingsIcon} />,
    // Только для администраторов
    roles: ["HR_ADMIN", "SYSTEM_ADMIN"],
  },
  {
    key: "hr-data",
    label: "Кадровые данные",
    path: ROUTES.hrData,
    icon: <Box as={PersonIcon} />,
    // Только для администраторов
    roles: ["HR_ADMIN", "SYSTEM_ADMIN"],
  },
  {
    key: "moderation",
    label: "Модерация",
    path: ROUTES.moderation,
    icon: <Box as={ImageIcon} />,
    // Только для администраторов
    roles: ["HR_ADMIN", "SYSTEM_ADMIN"],
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const activeColor = "#763186";
  const inactiveColor = useColorModeValue("gray.500", "gray.400");

  // Фильтруем пункты навигации по роли пользователя
  const navItems = useMemo(() => {
    if (!user?.role) return [];
    return allNavItems.filter((item) => {
      // Если роли не указаны, доступно всем
      if (!item.roles || item.roles.length === 0) return true;
      // Проверяем, есть ли роль пользователя в списке разрешенных
      return item.roles.includes(user.role);
    });
  }, [user?.role]);

  // Найти ID сотрудника по email пользователя
  // В бэкенде User и Employee - это одна сущность, поэтому можно использовать user.id напрямую
  // Но для получения полной информации о сотруднике (photoUrl и т.д.) ищем в списке сотрудников
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["current-user-employee", user?.email, user?.id],
    queryFn: async () => {
      if (!user?.email && !user?.id) return null;
      try {
        const employees = await employeesAPI.list();
        // Ищем по email (точное совпадение или без учета регистра)
        let found = employees.find(
          (emp) => emp.email?.toLowerCase() === user.email?.toLowerCase()
        );
        // Если не нашли по email, попробуем по id
        if (!found && user?.id) {
          found = employees.find((emp) => emp.id === user.id);
        }
        return found || null;
      } catch (error) {
        console.error("Error fetching current user employee:", error);
        return null;
      }
    },
    enabled: Boolean(user?.email || user?.id),
  });

  // Формируем имя для отображения
  const displayName = useMemo(() => {
    if (currentUserEmployee) {
      const { lastName, firstName } = currentUserEmployee;
      if (lastName || firstName) {
        return `${lastName || ""} ${firstName || ""}`.trim();
      }
      return currentUserEmployee.name || "—";
    }
    if (user) {
      return `${user.first_name} ${user.last_name}`.trim() || "—";
    }
    return "—";
  }, [currentUserEmployee, user]);

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const handleProfileClick = () => {
    // Используем ID сотрудника, если найден, иначе используем user.id
    // В бэкенде User и Employee - это одна сущность, поэтому user.id должен работать
    const profileId = currentUserEmployee?.id || user?.id;

    if (profileId) {
      navigate(`/profile/${profileId}`);
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
            {/* Логотип компании */}
            <Image
              src="/logo.png"
              alt="UDV Team Map Logo"
              h="32px"
              w="auto"
              objectFit="contain"
              fallback={
                <Box
                  w="32px"
                  h="32px"
                  bg="transparent"
                  border="2px solid"
                  borderColor="#00D9C0"
                  position="relative"
                  transform="rotate(45deg)"
                >
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%) rotate(-45deg)"
                    w="20px"
                    h="20px"
                    border="2px solid"
                    borderColor="#00D9C0"
                  />
                </Box>
              }
            />

            {/* Navigation Links */}
            {navItems.map((item) => {
              const active = isActive(item.path);
              const iconColor = active ? activeColor : inactiveColor;

              // Рендерим иконку с правильным цветом
              let iconElement = item.icon;
              if (item.key === "admin-panel") {
                iconElement = <SettingsIcon color={iconColor} />;
              } else if (item.key === "moderation") {
                iconElement = <ImageIcon color={iconColor} />;
              }

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
                    {iconElement}
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
            <Box
              as="button"
              onClick={handleProfileClick}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              <Avatar
                size="sm"
                name={displayName}
                src={user?.photo_url || currentUserEmployee?.photoUrl}
              />
            </Box>
            <Text
              color={activeColor}
              fontWeight="medium"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={handleProfileClick}
            >
              {displayName}
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
