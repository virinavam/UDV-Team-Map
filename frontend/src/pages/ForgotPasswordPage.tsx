import React from "react";
import { Box, Heading, Text, VStack, Image } from "@chakra-ui/react";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

const ForgotPasswordPage: React.FC = () => {
  return (
    <Box
      minH="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      pt={8}
    >
      <Image
        src="/logo.png"
        alt="UDV Group"
        boxSize="220px"
        objectFit="contain"
        mb={4}
      />

      <VStack
        w="100%"
        maxW="500px"
        bg="white"
        borderRadius="2xl"
        boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
        p={8}
        spacing={6}
      >
        <VStack spacing={2} textAlign="center" w="100%">
          <Heading size="lg" fontWeight="bold" color="gray.800">
            Восстановление доступа
          </Heading>
          <Text color="gray.600" fontSize="md">
            Укажите корпоративный email — мы отправим ссылку для восстановления
          </Text>
        </VStack>

        <ForgotPasswordForm />
      </VStack>
    </Box>
  );
};

export default ForgotPasswordPage;




