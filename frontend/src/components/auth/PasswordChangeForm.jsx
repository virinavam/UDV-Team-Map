import React, { useState } from "react";
import {
  Button,
  Input,
  VStack,
  FormControl,
  FormLabel,
  Text,
} from "@chakra-ui/react";

export default function PasswordChangeForm({ onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          <FormLabel>Новый пароль</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите новый пароль"
            required
            borderColor="#763186"
            _focus={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
            _hover={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Подтвердите пароль</FormLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите пароль"
            required
            borderColor="#763186"
            _focus={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
            _hover={{
              borderColor: "#763186",
              boxShadow: "0 0 0 1px #763186",
            }}
          />
        </FormControl>

        {error && <Text color="red.500">{error}</Text>}

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
}
