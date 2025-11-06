import React, { useState } from "react";
import { Box, Heading, Text, VStack, Image } from "@chakra-ui/react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import PasswordResetForm from "./PasswordResetForm";
import PasswordChangeForm from "./PasswordChangeForm";

// Возможные виды аутентификации
export const AuthViews = {
  LOGIN: "login",
  REGISTER: "register",
  RESET_PASSWORD: "reset-password",
  PASSWORD_CHANGE_SUCCESS: "password-change",
};

export default function AuthScreen({ onAuthenticated }) {
  const [view, setView] = useState(AuthViews.LOGIN);

  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
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
        w="40%"
        bg="white"
        borderRadius="2xl"
        boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
        p={8}
        spacing={8}
        mt={0}
      >
        {/* Заголовок */}
        <VStack spacing={2} textAlign="center">
          <Heading size="lg">UDV Team Map</Heading>
          {view === AuthViews.LOGIN && (
            <Text>Войдите в аккаунт для получения доступа к сервису </Text>
          )}
          {view === AuthViews.REGISTER && (
            <Text>Создайте аккаунт для доступа к сервису</Text>
          )}
          {view === AuthViews.RESET_PASSWORD && (
            <Text mb={4}>
              Введите Ваш email, чтобы получить инструкцию для смены пароля{" "}
            </Text>
          )}
          {view === AuthViews.PASSWORD_CHANGE && (
            <Text>Введите новый пароль и подтвердите его</Text>
          )}
        </VStack>

        {/* Выбор формы */}
        {view === AuthViews.LOGIN && (
          <LoginForm
            onSuccess={onAuthenticated}
            onForgotPassword={() => setView(AuthViews.RESET_PASSWORD)}
            onRegister={() => setView(AuthViews.REGISTER)}
          />
        )}
        {view === AuthViews.REGISTER && (
          <RegisterForm
            onSuccess={() => setView(AuthViews.PASSWORD_CHANGE_SUCCESS)}
            onBackToLogin={() => setView(AuthViews.LOGIN)}
          />
        )}
        {view === AuthViews.RESET_PASSWORD && (
          <PasswordResetForm
            onSuccess={() => setView(AuthViews.PASSWORD_CHANGE)}
            onBack={() => setView(AuthViews.LOGIN)}
          />
        )}
        {view === AuthViews.PASSWORD_CHANGE && (
          <PasswordChangeForm
            onSuccess={() => setView(AuthViews.LOGIN)}
            onBack={() => setView(AuthViews.LOGIN)}
          />
        )}
      </VStack>
    </Box>
  );
}
