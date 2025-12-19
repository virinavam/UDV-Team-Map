import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import type { Employee } from "../../types/types";
import AvatarUploader from "./AvatarUploader";
import SkillsSelector from "../SkillsSelector";
import { useAuth } from "../../context/AuthContext";

interface ProfileEditFormProps {
  employee: Employee;
  onFieldChange: (field: keyof Employee, value: any) => void;
  onCancel: () => void;
  onSave: () => void;
  onAvatarSelect: (file: File) => void;
  isSaving: boolean;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  employee,
  onFieldChange,
  onCancel,
  onSave,
  onAvatarSelect,
  isSaving,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN";
  const fullName = `${employee.lastName || ""} ${
    employee.firstName || ""
  }`.trim();

  const handleSkillsChange = (skills: string[]) => {
    onFieldChange("skills", skills);
  };

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
          <Box>
            <AvatarUploader
              fullName={fullName || employee.name}
              photoUrl={employee.photoUrl}
              onSelect={onAvatarSelect}
            />
          </Box>

          {/* Персональные данные справа */}
          <Box flex={1}>
            <VStack spacing={4} align="stretch">
              <InputField
                label="Фамилия"
                value={employee.lastName || ""}
                onChange={(value) => onFieldChange("lastName", value)}
                showClear
                onClear={() => onFieldChange("lastName", "")}
              />
              <InputField
                label="Имя"
                value={employee.firstName || ""}
                onChange={(value) => onFieldChange("firstName", value)}
              />
              <InputField
                label="Дата рождения"
                value={employee.dateOfBirth || ""}
                onChange={(value) => onFieldChange("dateOfBirth", value)}
              />
              <InputField
                label="Город"
                value={employee.city || ""}
                onChange={(value) => onFieldChange("city", value)}
                showClear
                onClear={() => onFieldChange("city", "")}
              />

              {/* Навыки */}
              <Box>
                {isAdmin ? (
                  <SkillsSelector
                    selectedSkills={employee.skills || []}
                    onChange={handleSkillsChange}
                  />
                ) : (
                  <Box>
                    <Text
                      fontWeight="semibold"
                      color="gray.600"
                      mb={2}
                      fontSize="sm"
                    >
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
                        <Text color="gray.400" fontSize="sm">
                          Нет навыков
                        </Text>
                      )}
                    </HStack>
                  </Box>
                )}
              </Box>

              {/* О себе */}
              <Box>
                <Text
                  fontWeight="semibold"
                  color="gray.600"
                  mb={2}
                  fontSize="sm"
                >
                  О себе
                </Text>
                <Textarea
                  value={employee.aboutMe || ""}
                  onChange={(e) => onFieldChange("aboutMe", e.target.value)}
                  placeholder="Расскажите о себе"
                  bg="white"
                  borderColor="gray.300"
                  rows={3}
                  fontSize="sm"
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
            <InputField
              label="Должность"
              value={employee.position || ""}
              onChange={(value) => onFieldChange("position", value)}
            />
            <InputField
              label="Подразделение"
              value={employee.departmentFull || employee.department || ""}
              onChange={(value) => onFieldChange("departmentFull", value)}
            />
            <InputField
              label="Руководитель"
              value={employee.managerName || ""}
              onChange={(value) => onFieldChange("managerName", value)}
            />
            <InputField
              label="Стаж работы в компании"
              value={employee.workExperience || ""}
              onChange={(value) => onFieldChange("workExperience", value)}
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
            <InputField
              label="Почта"
              value={employee.email || ""}
              onChange={(value) => onFieldChange("email", value)}
              showClear
              onClear={() => onFieldChange("email", "")}
            />
            <InputField
              label="Номер телефона"
              value={employee.phone || ""}
              onChange={(value) => onFieldChange("phone", value)}
              showClear
              onClear={() => onFieldChange("phone", "")}
            />
            <InputField
              label="Mattermost"
              value={employee.mattermost || ""}
              onChange={(value) => onFieldChange("mattermost", value)}
            />
            <InputField
              label="Telegram"
              value={employee.telegram || ""}
              onChange={(value) => onFieldChange("telegram", value)}
            />
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Кнопка сохранения внизу по центру */}
      <Box pt={4} display="flex" justifyContent="center">
        <Button
          colorScheme="#763186"
          size="lg"
          onClick={onSave}
          isLoading={isSaving}
          px={12}
        >
          Сохранить
        </Button>
      </Box>
    </VStack>
  );
};

const InputField: React.FC<{
  label: string;
  value?: string | null;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}> = ({
  label,
  value,
  onChange,
  readOnly = false,
  showClear = false,
  onClear,
}) => (
  <Box>
    <Text fontWeight="semibold" color="gray.600" mb={2} fontSize="sm">
      {label}
    </Text>
    <InputGroup>
      <Input
        value={value || ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        bg={readOnly ? "gray.50" : "white"}
        borderColor="gray.300"
        _focus={{ borderColor: "purple.400" }}
        fontSize="sm"
        placeholder="Введите текст..."
      />
      {showClear && value && (
        <InputRightElement>
          <IconButton
            aria-label="Очистить"
            icon={<CloseIcon />}
            size="xs"
            variant="ghost"
            onClick={onClear}
            h="20px"
            minW="20px"
          />
        </InputRightElement>
      )}
    </InputGroup>
  </Box>
);

export default ProfileEditForm;
