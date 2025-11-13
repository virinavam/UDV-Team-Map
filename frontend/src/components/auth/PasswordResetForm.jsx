import React, { useState } from "react";
import {
  Button,
  Input,
  VStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

export default function PasswordResetForm({ onSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@udv.com"
            required
          />
        </FormControl>

        <Button
          type="submit"
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#526ED3"
          color="white"
          isLoading={loading}
          _hover={{ bg: "#4356b0" }}
        >
          Отправить письмо
        </Button>

        <Button
          variant="outline"
          w="435px"
          h="44px"
          borderRadius="12px"
          color="#526ED3"
          bg="#F4F4F4"
          _hover={{ bg: "#F4F4F4" }}
          onClick={onBack}
        >
          Вернуться назад
        </Button>
      </VStack>
    </form>
  );
}
