import React, { useState, useEffect, useId } from "react";
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
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../lib/api";

const schema = yup.object().shape({
  email: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .email("Некорректный email")
    .max(64, "Не более 64 символов")
    .required("Email обязателен"),
});

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const emailId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  });

  // Автоматический редирект через 3 секунды после успеха
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword(data);

      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Успешно",
          description: "Инструкция отправлена на ваш email",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Ошибка",
          description: response.message || "Произошла ошибка",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка. Попробуйте еще раз.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Box w="100%" maxW="435px" textAlign="center">
        <Text color="green.500" mb={4}>
          Инструкция отправлена на ваш email
        </Text>
        <Text color="gray.600" fontSize="sm">
          Перенаправление на страницу входа через 3 секунды...
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%" maxW="435px">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.email}>
            <FormLabel htmlFor={emailId}>Email</FormLabel>
            <Input
              id={emailId}
              type="email"
              placeholder="your.email@udv.com"
              {...register("email")}
              bg="white"
              borderColor="#763186"
              _focus={{
                borderColor: "#763186",
                boxShadow: "0 0 0 1px #763186", // вот эта строка делает обводку нужного цвета
              }}
              _hover={{
                borderColor: "#763186",
                boxShadow: "0 0 0 1px #763186",
              }}
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>

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
            Отправить письмо
          </Button>

          <Button
            type="button"
            variant="link"
            color="#763186"
            fontSize="sm"
            fontWeight="normal"
            onClick={() => navigate("/login")}
            _hover={{ textDecoration: "underline" }}
          >
            Вернуться назад
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
