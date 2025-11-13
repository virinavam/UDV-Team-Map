import React, { useState } from "react";
import {
  Button,
  Input,
  VStack,
  FormControl,
  FormLabel,
  Text,
} from "@chakra-ui/react";

export default function RegisterForm({ onSuccess, onBackToLogin }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

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
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>Подтвердите пароль</FormLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </FormControl>

        {error && <Text color="red.500">{error}</Text>}

        <Button type="submit" colorScheme="blue" w="full" isLoading={loading}>
          Зарегистрироваться
        </Button>
        <Button variant="link" w="full" onClick={onBackToLogin}>
          Назад к входу
        </Button>
      </VStack>
    </form>
  );
}
