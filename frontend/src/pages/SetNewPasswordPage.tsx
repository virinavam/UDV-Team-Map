import React, { useCallback } from "react";
import { Box, Heading, Text, VStack, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import SetNewPasswordForm from "../components/auth/SetNewPasswordForm";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes/paths";

export default function SetNewPasswordPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  const handleAuthenticated = useCallback(async () => {
    await refreshSession();
    navigate(ROUTES.employees);
  }, [refreshSession, navigate]);
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
          <Text color="gray.600" fontSize="md" mt={2}>
            Войдите в аккаунт для получения доступа к сервису
          </Text>
          <Text color="gray.800" fontSize="md" fontWeight="semibold" mt={4}>
            Новый пароль
          </Text>
        </VStack>

        {/* Форма установки нового пароля */}
        <SetNewPasswordForm onAuthenticated={handleAuthenticated} />
      </VStack>
    </Box>
  );
}
