import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { Employee } from "../../types/types";

interface ProfileViewProps {
  employee: Employee;
}

const ProfileView: React.FC<ProfileViewProps> = ({ employee }) => {
  const fullName = `${employee.lastName || ""} ${employee.firstName || ""}`.trim();

  return (
    <VStack spacing={6} align="stretch">
      {/* Основная карточка с фото и персональными данными */}
      <Box
        bg="white"
        borderRadius="lg"
        p={8}
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack spacing={8} align="start">
          {/* Фотография слева */}
          <Avatar
            size="2xl"
            name={fullName || employee.name}
            src={employee.photoUrl}
            borderRadius="full"
            border="4px solid"
            borderColor="gray.100"
          />

          {/* Персональные данные справа */}
          <Box flex={1}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
              {fullName || employee.name}
            </Text>

            <VStack spacing={4} align="stretch">
              <InputField label="Дата рождения" value={employee.dateOfBirth} />
              <InputField label="Город" value={employee.city} />

              {/* Навыки как теги */}
              <Box>
                <Text fontWeight="semibold" color="gray.600" mb={2}>
                  Навыки
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {employee.skills && employee.skills.length > 0 ? (
                    employee.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        px={3}
                        py={1}
                        borderRadius="md"
                        bg="green.100"
                        color="green.800"
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <Text color="gray.400">Нет навыков</Text>
                  )}
                </HStack>
              </Box>

              {/* О себе */}
              <Box>
                <Text fontWeight="semibold" color="gray.600" mb={2}>
                  О себе
                </Text>
                <Textarea
                  value={employee.aboutMe || ""}
                  readOnly
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: "gray.300" }}
                  rows={3}
                  resize="none"
                />
              </Box>
            </VStack>
          </Box>
        </HStack>
      </Box>

      {/* Две нижние карточки */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Информация о работе */}
        <Box
          bg="white"
          borderRadius="lg"
          p={6}
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Информация о работе
          </Text>
          <VStack spacing={4} align="stretch">
            <InputField label="Должность" value={employee.position} />
            <InputField
              label="Подразделение"
              value={employee.departmentFull || employee.department}
            />
            <InputField label="Руководитель" value={employee.managerName} />
            <InputField
              label="Стаж работы в компании"
              value={employee.workExperience}
            />
          </VStack>
        </Box>

        {/* Контактная информация */}
        <Box
          bg="white"
          borderRadius="lg"
          p={6}
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Контактная информация
          </Text>
          <VStack spacing={4} align="stretch">
            <InputField label="Почта" value={employee.email} />
            <InputField label="Номер телефона" value={employee.phone} />
            <InputField label="Mattermost" value={employee.mattermost} />
            <InputField label="Telegram" value={employee.telegram} />
          </VStack>
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

const InputField: React.FC<{
  label: string;
  value?: string | number | null;
}> = ({ label, value }) => (
  <Box>
    <Text fontWeight="semibold" color="gray.600" mb={2} fontSize="sm">
      {label}
    </Text>
    <Input
      value={value || ""}
      readOnly
      bg="gray.50"
      borderColor="gray.200"
      _focus={{ borderColor: "gray.300" }}
      fontSize="sm"
    />
  </Box>
);

export default ProfileView;






