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
            borderColor="gray.300"
            _focus={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
            _hover={{
              borderColor: "gray.300", // при наведении остаётся серым
              boxShadow: "0 0 0 1px gray.300",
            }}
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
            borderColor="gray.300"
            _focus={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
          />
        </FormControl>

        <Button
          type="submit"
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#763186"
          color="white"
          isLoading={loading}
          _hover={{ bg: "#763186" }}
        >
          Войти
        </Button>

        <Button
          w="435px"
          h="44px"
          borderRadius="12px"
          bg="#F4F4F4"
          color="#763186"
          onClick={onForgotPassword}
          _hover={{ bg: "#F4F4F4" }}
        >
          Забыли пароль?
        </Button>
      </VStack>
    </form>
  );
}
