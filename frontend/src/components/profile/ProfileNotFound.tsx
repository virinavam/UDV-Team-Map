/**
 * Компонент для отображения ошибки "Сотрудник не найден"
 */

import React from "react";
import {Center, Text, Button, VStack, HStack} from "@chakra-ui/react";
import {useNavigate} from "react-router-dom";
import MainLayout from "../MainLayout";

interface ProfileNotFoundProps {
    error?: Error | null;
}

export const ProfileNotFound: React.FC<ProfileNotFoundProps> = ({error}) => {
    const navigate = useNavigate();

    const errorMessage =
        error instanceof Error
            ? error.message
            : "Сотрудник не найден или был удален";

    return (
        <MainLayout>
            <Center h="70vh" flexDirection="column" gap={4}>
                <VStack spacing={4}>
                    <Text fontSize="xl" fontWeight="bold" color="gray.700">
                        Сотрудник не найден
                    </Text>
                    <Text color="gray.600" textAlign="center" maxW="400px">
                        {errorMessage}
                    </Text>
                    <HStack spacing={4} mt={4}>
                        <Button onClick={() => navigate(-1)} variant="outline">
                            Вернуться назад
                        </Button>
                        <Button
                            onClick={() => navigate("/employees")}
                            bg="#763186"
                            color="white"
                            _hover={{bg: "#5a2568"}}
                        >
                            К списку сотрудников
                        </Button>
                    </HStack>
                </VStack>
            </Center>
        </MainLayout>
    );
};
