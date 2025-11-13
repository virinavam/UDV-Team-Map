import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Flex, Text, HStack, useColorModeValue } from "@chakra-ui/react";

interface HeaderProps {
  currentPage?: "team-map" | "employees";
}

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = (): "team-map" | "employees" => {
    if (location.pathname === "/team-map") return "team-map";
    return "employees";
  };

  const activePage = currentPage || getCurrentPage();

  const handleNavigate = (page: "team-map" | "employees") => {
    const path = page === "team-map" ? "/team-map" : "/employees";
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const activeColor = "#763186"; // цвет активного элемента
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = "#763186";

  return (
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
        {/* Левая часть: UDV Team Map + кнопки */}
        <HStack spacing={6} align="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            UDV Team Map
          </Text>

          {/* Кнопки навигации */}
          <Box
            as="button"
            onClick={() => handleNavigate("team-map")}
            position="relative"
            pb={2}
            _hover={{ color: activeColor }}
            color={activePage === "team-map" ? activeColor : inactiveColor}
            fontWeight={activePage === "team-map" ? "semibold" : "normal"}
            transition="all 0.2s"
            cursor="pointer"
          >
            <Text>Team Map</Text>
            {activePage === "team-map" && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="2px"
                bg={borderColor}
              />
            )}
          </Box>

          <Box
            as="button"
            onClick={() => handleNavigate("employees")}
            position="relative"
            pb={2}
            _hover={{ color: activeColor }}
            color={activePage === "employees" ? activeColor : inactiveColor}
            fontWeight={activePage === "employees" ? "semibold" : "normal"}
            transition="all 0.2s"
            cursor="pointer"
          >
            <Text>Сотрудники</Text>
            {activePage === "employees" && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="2px"
                bg={borderColor}
              />
            )}
          </Box>
        </HStack>

        {/* Правая часть: имя пользователя */}
        <Text color={activeColor} fontWeight="medium">
          Ольга Лебедева
        </Text>
      </Flex>
    </Box>
  );
};

export default Header;
