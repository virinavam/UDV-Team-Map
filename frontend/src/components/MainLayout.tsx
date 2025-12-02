import React from "react";
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
import { authAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: string;
};

const navItems: NavItem[] = [
  { key: "team-map", label: "Team Map", path: "/team-map" },
  { key: "employees", label: "Сотрудники", path: "/employees" },
  { key: "admin", label: "Кадровые данные", path: "/admin" },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const activeColor = "#763186";
  const inactiveColor = useColorModeValue("gray.500", "gray.400");

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/team-map") {
      return location.pathname === "/team-map";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    navigate("/login");
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
                  _hover={{ color: activeColor }}
                  color={active ? activeColor : inactiveColor}
                  fontWeight={active ? "semibold" : "normal"}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <HStack spacing={2}>
                    {item.icon && <Text>{item.icon}</Text>}
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
              src={user?.photo_url}
            />
            <Text color={activeColor} fontWeight="medium">
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
