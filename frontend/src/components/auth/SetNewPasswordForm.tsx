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
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../../lib/api";

// Валидация пароля: минимум 8 символов, буквы и цифры
const passwordSchema = yup
  .string()
  .required("Пароль обязателен")
  .min(8, "Пароль должен содержать минимум 8 символов")
  .test(
    "has-letters-and-numbers",
    "Пароль должен содержать буквы и цифры",
    (value) => {
      if (!value) return false;
      const hasLetters = /[a-zA-Zа-яА-Я]/.test(value);
      const hasNumbers = /[0-9]/.test(value);
      return hasLetters && hasNumbers;
    }
  );

const schema = yup.object().shape({
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .required("Подтверждение пароля обязательно")
    .oneOf([yup.ref("password")], "Пароли не совпадают"),
});

interface SetNewPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface SetNewPasswordFormProps {
  onAuthenticated: () => void;
}

export default function SetNewPasswordForm({
  onAuthenticated,
}: SetNewPasswordFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получаем токен из state или из URL параметров
  const token =
    location.state?.token ||
    new URLSearchParams(location.search).get("token") ||
    "mock_token";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetNewPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: SetNewPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.setPassword({
        token,
        newPassword: data.password,
      });

      if (response.success) {
        // Автоматический вход и редирект в основное приложение
        onAuthenticated();
      } else {
        setError(response.message || "Произошла ошибка при установке пароля");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="100%" maxW="435px">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Введите ваш пароль</FormLabel>
            <Input
              type="password"
              placeholder="Введите ваш пароль"
              {...register("password")}
              bg="white"
              borderColor={errors.password ? "red.500" : "gray.300"}
              _focus={{
                borderColor: errors.password ? "red.500" : "blue.500",
                boxShadow:
                  "0 0 0 1px " + (errors.password ? "red.500" : "blue.500"),
              }}
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Подтвердите пароль</FormLabel>
            <Input
              type="password"
              placeholder="Введите ваш пароль"
              {...register("confirmPassword")}
              bg="white"
              borderColor={errors.confirmPassword ? "red.500" : "gray.300"}
              _focus={{
                borderColor: errors.confirmPassword ? "red.500" : "blue.500",
                boxShadow:
                  "0 0 0 1px " +
                  (errors.confirmPassword ? "red.500" : "blue.500"),
              }}
            />
            {errors.confirmPassword && (
              <FormErrorMessage>
                {errors.confirmPassword.message}
              </FormErrorMessage>
            )}
          </FormControl>

          {error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            w="100%"
            h="44px"
            borderRadius="12px"
            bg="#763186"
            color="white"
            isLoading={isLoading}
            _hover={{ bg: "#763186" }}
            _loading={{ opacity: 0.8 }}
          >
            Войти
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
