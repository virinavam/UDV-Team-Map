import React, { useState } from "react";
import {
  Button,
  Input,
  VStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

export default function LoginForm({ onSuccess, onForgotPassword, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        <FormControl>
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
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
          Войти
        </Button>

        <Button
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#F4F4F4"
          color="#526ED3"
          onClick={onForgotPassword}
          _hover={{ bg: "#F4F4F4" }}
        >
          Забыли пароль?
        </Button>
      </VStack>
    </form>
  );
}
