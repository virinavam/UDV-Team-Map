import React from "react";
import {
  Avatar,
  Box,
  Divider,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Employee } from "../../types/types";

interface ProfileViewProps {
  employee: Employee;
}

const ProfileView: React.FC<ProfileViewProps> = ({ employee }) => {
  const fullName = `${employee.lastName || ""} ${employee.firstName || ""} ${
    employee.middleName || ""
  }`.trim();

  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={6} align="start">
        <Avatar size="2xl" name={fullName} src={employee.photoUrl} />
        <Box flex={1}>
          <Text fontSize="3xl" fontWeight="bold" mb={4}>
            {fullName || employee.name}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <InfoBlock label="Дата рождения" value={employee.dateOfBirth} />
            <InfoBlock label="Город" value={employee.city} />
            <InfoBlock label="Навыки" value={employee.skills.join(", ")} />
            <InfoBlock label="О себе" value={employee.aboutMe} />
          </SimpleGrid>
        </Box>
      </HStack>

      <Divider />

      <Box>
        <SectionTitle>Информация о работе</SectionTitle>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <InfoBlock label="Должность" value={employee.position} />
          <InfoBlock
            label="Подразделение"
            value={employee.departmentFull || employee.department}
          />
          <InfoBlock label="Руководитель" value={employee.managerName} />
          <InfoBlock label="Стаж" value={employee.workExperience} />
        </SimpleGrid>
      </Box>

      <Divider />

      <Box>
        <SectionTitle>Контакты</SectionTitle>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <InfoBlock label="Почта" value={employee.email} />
          <InfoBlock label="Телефон" value={employee.phone} />
          <InfoBlock label="Mattermost" value={employee.mattermost} />
          <InfoBlock label="Telegram" value={employee.telegram} />
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontSize="xl" fontWeight="bold" mb={4}>
    {children}
  </Text>
);

const InfoBlock: React.FC<{ label: string; value?: string | number | null }> = ({
  label,
  value,
}) => (
  <VStack align="start" spacing={1}>
    <Text fontWeight="semibold" color="gray.600">
      {label}
    </Text>
    <Text>{value || "—"}</Text>
  </VStack>
);

export default ProfileView;



