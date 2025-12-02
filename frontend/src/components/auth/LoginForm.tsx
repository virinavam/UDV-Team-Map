import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  Input,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Box,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../lib/api";
import { ROUTES } from "../../routes/paths";

const trimValue = (value?: string | null) => value?.trim() ?? "";

const schema = yup.object().shape({
  email: yup
    .string()
    .transform((value) => trimValue(value))
    .email("Некорректный email")
    .max(64, "Email не должен превышать 64 символа")
    .required("Email обязателен"),
  password: yup
    .string()
    .transform((value) => trimValue(value))
    .min(6, "Минимум 6 символов")
    .max(64, "Пароль не должен превышать 64 символа")
    .test(
      "not-empty",
      "Пароль не может состоять только из пробелов",
      (value) => Boolean(value?.trim())
    )
    .required("Пароль обязателен"),
});

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onAuthenticated: () => void;
}

export default function LoginForm({ onAuthenticated }: LoginFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    mode: "onChange", // Валидация при изменении полей
    reValidateMode: "onChange", // Перевалидация при изменении
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(data);

      if (response.success) {
        // Вызываем callback для обновления состояния аутентификации
        onAuthenticated();

        if (response.isTemporaryPassword) {
          // Редирект на установку нового пароля
          navigate(ROUTES.setPassword, { state: { token: response.token } });
        } else {
          navigate(ROUTES.employees);
        }
      } else {
        setError(response.message || "Неверный email или пароль");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Validation errors:", errors);
    // Ошибки валидации уже отображаются через FormErrorMessage
  };

  return (
    <Box w="100%" maxW="435px">
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="your.email@udv.com"
              {...register("email")}
              bg="white"
              borderColor={errors.email ? "red.500" : "gray.300"}
              _focus={{
                borderColor: errors.email ? "red.500" : "blue.500",
                boxShadow: errors.email
                  ? "0 0 0 1px var(--chakra-colors-red-500)"
                  : "0 0 0 1px var(--chakra-colors-blue-500)",
              }}
            />
            {errors.email && (
              <FormErrorMessage mt={1} fontSize="sm" color="red.600">
                {errors.email.message}
              </FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.password || !!error}>
            <FormLabel>Пароль</FormLabel>
            <Input
              type="password"
              placeholder="Введите ваш пароль"
              {...register("password")}
              bg="white"
              borderColor={errors.password || error ? "red.500" : "gray.300"}
              _focus={{
                borderColor: errors.password || error ? "red.500" : "blue.500",
                boxShadow:
                  errors.password || error
                    ? "0 0 0 1px var(--chakra-colors-red-500)"
                    : "0 0 0 1px var(--chakra-colors-blue-500)",
              }}
            />
            {errors.password && (
              <FormErrorMessage mt={1} fontSize="sm" color="red.600">
                {errors.password.message}
              </FormErrorMessage>
            )}
          </FormControl>

          {error && (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="md"
              p={3}
              mt={2}
            >
              <Text color="red.600" fontSize="sm" fontWeight="medium">
                {error}
              </Text>
            </Box>
          )}

          <Button
            type="submit"
            w="100%"
            h="44px"
            borderRadius="12px"
            bg="#763186"
            color="white"
            isLoading={isLoading}
            _hover={{ bg: "#4356b0" }}
            _loading={{ opacity: 0.8 }}
          >
            Войти
          </Button>

          <Button
            type="button"
            variant="link"
            color="#763186"
            fontSize="sm"
            fontWeight="normal"
            onClick={() => navigate(ROUTES.forgotPassword)}
            _hover={{ textDecoration: "underline" }}
          >
            Забыли пароль?
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
