import React, { useState, useEffect } from "react";
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
    .email("Некорректный email")
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
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="your.email@udv.com"
              {...register("email")}
              bg="white"
              borderColor={errors.email ? "red.500" : "gray.300"}
              _focus={{
                borderColor: errors.email ? "red.500" : "blue.500",
                boxShadow: "0 0 0 1px " + (errors.email ? "red.500" : "blue.500"),
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
            bg="#526ED3"
            color="white"
            isLoading={isLoading}
            _hover={{ bg: "#4356b0" }}
            _loading={{ opacity: 0.8 }}
          >
            Отправить письмо
          </Button>

          <Button
            type="button"
            variant="link"
            color="#526ED3"
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

