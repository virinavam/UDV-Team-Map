import React from "react";
import {
  Box,
  Button,
  HStack,
  Input,
  SimpleGrid,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { Employee } from "../../types/types";
import AvatarUploader from "./AvatarUploader";

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
  const fullName = `${employee.lastName || ""} ${employee.firstName || ""} ${
    employee.middleName || ""
  }`.trim();

  return (
    <VStack spacing={6} align="stretch">
      <AvatarUploader
        fullName={fullName || employee.name}
        photoUrl={employee.photoUrl}
        onSelect={onAvatarSelect}
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <InputField
          label="Фамилия"
          value={employee.lastName}
          onChange={(value) => onFieldChange("lastName", value)}
        />
        <InputField
          label="Имя"
          value={employee.firstName}
          onChange={(value) => onFieldChange("firstName", value)}
        />
        <InputField
          label="Отчество"
          value={employee.middleName}
          onChange={(value) => onFieldChange("middleName", value)}
        />
        <InputField
          label="Город"
          value={employee.city}
          onChange={(value) => onFieldChange("city", value)}
        />
        <InputField
          label="Должность"
          value={employee.position}
          onChange={(value) => onFieldChange("position", value)}
        />
        <InputField
          label="Подразделение"
          value={employee.departmentFull || employee.department}
          onChange={(value) => onFieldChange("departmentFull", value)}
        />
        <InputField
          label="Почта"
          value={employee.email}
          onChange={(value) => onFieldChange("email", value)}
        />
        <InputField
          label="Телефон"
          value={employee.phone}
          onChange={(value) => onFieldChange("phone", value)}
        />
      </SimpleGrid>

      <Box>
        <Textarea
          value={employee.skills.join(", ")}
          onChange={(e) =>
            onFieldChange(
              "skills",
              e.target.value
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
            )
          }
          placeholder="Навыки через запятую"
          bg="white"
        />
      </Box>

      <Box>
        <Textarea
          value={employee.aboutMe || ""}
          onChange={(e) => onFieldChange("aboutMe", e.target.value)}
          placeholder="Расскажите о себе"
          rows={4}
          bg="white"
        />
      </Box>

      <HStack spacing={4} justify="flex-end">
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button colorScheme="purple" onClick={onSave} isLoading={isSaving}>
          Сохранить
        </Button>
      </HStack>
    </VStack>
  );
};

const InputField: React.FC<{
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <VStack align="start" spacing={2}>
    <Box fontWeight="semibold" color="gray.600">
      {label}
    </Box>
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      bg="white"
    />
  </VStack>
);

export default ProfileEditForm;




