import React from "react";
import { Box, Heading, Text, VStack, Image } from "@chakra-ui/react";
import LoginForm from "../components/auth/LoginForm";

interface LoginPageProps {
  onAuthenticated: () => void;
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      pt={8}
    >
      {/* Логотип */}
      <Image
        src="/logo.png"
        alt="UDV Group"
        boxSize="270px"
        objectFit="contain"
        mb={4}
      />

      <VStack
        w="100%"
        maxW="500px"
        bg="white"
        borderRadius="2xl"
        boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
        p={8}
        spacing={6}
      >
        {/* Заголовок */}
        <VStack spacing={2} textAlign="center" w="100%">
          <Heading size="lg" fontWeight="bold" color="gray.800">
            UDV Team Map
          </Heading>
          <Text color="gray.600" fontSize="md">
            Войдите в аккаунт для получения доступа к сервису
          </Text>
        </VStack>

        {/* Форма входа */}
        <LoginForm onAuthenticated={onAuthenticated} />
      </VStack>
    </Box>
  );
}

