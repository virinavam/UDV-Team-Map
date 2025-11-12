import React from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  Avatar,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";

interface HeaderProps {
  currentPage: "team-map" | "employees";
  onNavigate: (page: "team-map" | "employees") => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("blue.500", "blue.300");

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
        {/* Logo */}
        <Flex align="center" gap={2}>
          <Box
            w="32px"
            h="32px"
            bg="green.500"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontWeight="bold"
            fontSize="lg"
          >
            U
          </Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            UDV Team Map
          </Text>
        </Flex>

        {/* Navigation */}
        <HStack spacing={8}>
          <Box
            as="button"
            onClick={() => onNavigate("team-map")}
            position="relative"
            pb={2}
            _hover={{ color: activeColor }}
            color={currentPage === "team-map" ? activeColor : inactiveColor}
            fontWeight={currentPage === "team-map" ? "semibold" : "normal"}
            transition="all 0.2s"
          >
            <HStack spacing={2}>
              <Icon viewBox="0 0 24 24" w={5} h={5}>
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 19.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </Icon>
              <Text>Team Map</Text>
            </HStack>
            {currentPage === "team-map" && (
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
            onClick={() => onNavigate("employees")}
            position="relative"
            pb={2}
            _hover={{ color: activeColor }}
            color={currentPage === "employees" ? activeColor : inactiveColor}
            fontWeight={currentPage === "employees" ? "semibold" : "normal"}
            transition="all 0.2s"
          >
            <HStack spacing={2}>
              <Icon viewBox="0 0 24 24" w={5} h={5}>
                <path
                  fill="currentColor"
                  d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                />
              </Icon>
              <Text>Сотрудники</Text>
            </HStack>
            {currentPage === "employees" && (
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

        {/* User Profile */}
        <HStack spacing={2}>
          <Avatar size="sm" name="Ольга Лебедева" />
          <Text color="gray.700" fontWeight="medium">
            Ольга Лебедева
          </Text>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;

