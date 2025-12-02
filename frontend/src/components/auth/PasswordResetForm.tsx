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
  email: yup
    .string()
    .transform((value) => value?.trim() ?? "")
    .email("Некорректный email")
    .max(64, "Не более 64 символов")
    .required("Email обязателен"),
});

interface PasswordResetFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

interface PasswordResetFormData {
  email: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSuccess,
  onBack,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Password reset for", data.email);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            placeholder="your.email@udv.com"
            {...register("email")}
            borderColor="#763186"
            _focus={{ borderColor: "#763186", boxShadow: "0 0 0 1px #763186" }}
          />
          {errors.email && (
            <FormErrorMessage>{errors.email.message}</FormErrorMessage>
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
          Отправить письмо
        </Button>

        <Button
          variant="outline"
          w="435px"
          h="44px"
          borderRadius="12px"
          color="#763186"
          bg="#F4F4F4"
          _hover={{ bg: "#F4F4F4" }}
          onClick={onBack}
        >
          Вернуться назад
        </Button>
      </VStack>
    </form>
  );
};

export default PasswordResetForm;



