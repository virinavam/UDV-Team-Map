import React, { useId } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
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
    .required("Подтверждение пароля обязательно"),
});

interface PasswordChangeFormData {
  password: string;
  confirmPassword: string;
}

interface PasswordChangeFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSuccess,
  onBack,
}) => {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel htmlFor={passwordId}>Новый пароль</FormLabel>
          <Input
            id={passwordId}
            type="password"
            placeholder="Введите новый пароль"
            {...register("password")}
            borderColor="#763186"
            _focus={{ borderColor: "#763186", boxShadow: "0 0 0 1px #763186" }}
          />
          {errors.password && (
            <FormErrorMessage>{errors.password.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel htmlFor={confirmPasswordId}>Подтвердите пароль</FormLabel>
          <Input
            id={confirmPasswordId}
            type="password"
            placeholder="Подтвердите пароль"
            {...register("confirmPassword")}
            borderColor="#763186"
            _focus={{ borderColor: "#763186", boxShadow: "0 0 0 1px #763186" }}
          />
          {errors.confirmPassword && (
            <FormErrorMessage>
              {errors.confirmPassword.message}
            </FormErrorMessage>
          )}
        </FormControl>

        <Button
          type="submit"
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#763186"
          color="white"
          isLoading={isSubmitting}
          _hover={{ bg: "#763186" }}
        >
          Сохранить
        </Button>

        <Button
          type="button"
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#F4F4F4"
          color="#763186"
          onClick={onBack}
          _hover={{ bg: "#F4F4F4" }}
        >
          Назад
        </Button>
      </VStack>
    </form>
  );
};

export default PasswordChangeForm;
