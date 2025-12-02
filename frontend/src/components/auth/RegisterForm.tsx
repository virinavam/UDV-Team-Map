import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";

const schema = yup.object({
  password: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .required("Пароль обязателен")
    .min(8, "Минимум 8 символов")
    .max(64, "Не более 64 символов"),
  confirmPassword: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .oneOf([yup.ref("password")], "Пароли не совпадают")
    .required("Подтверждение обязательно"),
});

interface RegisterFormData {
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: yupResolver(schema) });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel>Пароль</FormLabel>
          <Input type="password" {...register("password")} />
          {errors.password && (
            <FormErrorMessage>{errors.password.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel>Подтвердите пароль</FormLabel>
          <Input type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <FormErrorMessage>
              {errors.confirmPassword.message}
            </FormErrorMessage>
          )}
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          w="full"
          isLoading={isSubmitting}
        >
          Зарегистрироваться
        </Button>
        <Button variant="link" w="full" onClick={onBackToLogin}>
          Назад к входу
        </Button>
      </VStack>
    </form>
  );
};

export default RegisterForm;





