import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Avatar,
  IconButton,
  SimpleGrid,
  Text,
  Box,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import type { Employee } from "../types/types";
import AvatarUploader from "./profile/AvatarUploader";
import { employeesAPI } from "../lib/api";
import {
  trimAndValidate,
  isNotEmpty,
  validateMaxLength,
  validateEmail,
  validatePhone,
  validateDate,
  FIELD_MAX_LENGTHS,
  REQUIRED_FIELDS,
} from "../lib/validation";

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employee: Employee) => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSave,
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
    middleName: "",
    city: "",
    position: "",
    hireDate: "",
    legalEntity: "",
    skills: [],
    department: "",
    description: "",
    managerName: "",
    group: "",
    email: "",
    phone: "",
  });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        skills: employee.skills || [],
      });
      setAvatarPreview(employee.photoUrl || null);
    } else {
      // Сброс формы для нового сотрудника
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        city: "",
        position: "",
        hireDate: "",
        legalEntity: "",
        skills: [],
        department: "",
        description: "",
        managerName: "",
        group: "",
        email: "",
        phone: "",
      });
      setAvatarPreview(null);
    }
    setPendingAvatarFile(null);
  }, [employee, isOpen]);

  const handleFieldChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Валидация обязательных полей
    if (!isNotEmpty(formData.firstName)) {
      newErrors.firstName = REQUIRED_FIELDS.firstName;
    }
    if (!isNotEmpty(formData.lastName)) {
      newErrors.lastName = REQUIRED_FIELDS.lastName;
    }
    if (!isNotEmpty(formData.email)) {
      newErrors.email = REQUIRED_FIELDS.email;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Некорректный email адрес";
    }

    // Валидация максимальных длин
    if (
      formData.firstName &&
      !validateMaxLength(formData.firstName, FIELD_MAX_LENGTHS.firstName)
    ) {
      newErrors.firstName = `Имя не должно превышать ${FIELD_MAX_LENGTHS.firstName} символов`;
    }
    if (
      formData.lastName &&
      !validateMaxLength(formData.lastName, FIELD_MAX_LENGTHS.lastName)
    ) {
      newErrors.lastName = `Фамилия не должна превышать ${FIELD_MAX_LENGTHS.lastName} символов`;
    }
    if (
      formData.email &&
      !validateMaxLength(formData.email, FIELD_MAX_LENGTHS.email)
    ) {
      newErrors.email = `Email не должен превышать ${FIELD_MAX_LENGTHS.email} символов`;
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Некорректный формат телефона";
    }
    if (
      formData.phone &&
      !validateMaxLength(formData.phone, FIELD_MAX_LENGTHS.phone)
    ) {
      newErrors.phone = `Телефон не должен превышать ${FIELD_MAX_LENGTHS.phone} символов`;
    }
    if (
      formData.position &&
      !validateMaxLength(formData.position, FIELD_MAX_LENGTHS.position)
    ) {
      newErrors.position = `Должность не должна превышать ${FIELD_MAX_LENGTHS.position} символов`;
    }
    if (
      formData.city &&
      !validateMaxLength(formData.city, FIELD_MAX_LENGTHS.city)
    ) {
      newErrors.city = `Город не должен превышать ${FIELD_MAX_LENGTHS.city} символов`;
    }
    if (formData.hireDate && !validateDate(formData.hireDate)) {
      newErrors.hireDate = "Некорректный формат даты (используйте DD.MM.YYYY)";
    }
    if (
      formData.telegram &&
      !validateMaxLength(formData.telegram, FIELD_MAX_LENGTHS.telegram)
    ) {
      newErrors.telegram = `Telegram не должен превышать ${FIELD_MAX_LENGTHS.telegram} символов`;
    }
    if (
      formData.mattermost &&
      !validateMaxLength(formData.mattermost, FIELD_MAX_LENGTHS.mattermost)
    ) {
      newErrors.mattermost = `Mattermost не должен превышать ${FIELD_MAX_LENGTHS.mattermost} символов`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarSelect = (file: File) => {
    setPendingAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleSkillsChange = (value: string) => {
    const skills = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    handleFieldChange("skills", skills);
  };

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    // Валидация формы перед сохранением
    if (!validateForm()) {
      toast({
        status: "error",
        title: "Ошибка валидации",
        description: "Пожалуйста, исправьте ошибки в форме",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Обрезаем пробелы из всех строковых полей
      const trimmedData = {
        ...formData,
        firstName: trimAndValidate(formData.firstName),
        lastName: trimAndValidate(formData.lastName),
        middleName: trimAndValidate(formData.middleName),
        email: trimAndValidate(formData.email),
        phone: trimAndValidate(formData.phone),
        city: trimAndValidate(formData.city),
        position: trimAndValidate(formData.position),
        telegram: trimAndValidate(formData.telegram),
        mattermost: trimAndValidate(formData.mattermost),
        managerName: trimAndValidate(formData.managerName),
        group: trimAndValidate(formData.group),
        legalEntity: trimAndValidate(formData.legalEntity),
        department: trimAndValidate(formData.department),
        description: trimAndValidate(formData.description),
        comment: trimAndValidate(formData.comment),
      };

      const employeeData: Employee = {
        id: employee?.id || `e${Date.now()}`,
        name:
          `${trimmedData.lastName || ""} ${trimmedData.firstName || ""} ${
            trimmedData.middleName || ""
          }`.trim() || "Новый сотрудник",
        position: trimmedData.position || "",
        city: trimmedData.city || "",
        email: trimmedData.email || "",
        skills: trimmedData.skills || [],
        status: trimmedData.status || "Активен",
        ...trimmedData, // остальные поля
      };

      // Если это редактирование существующего сотрудника и есть новый аватар
      if (employee?.id && pendingAvatarFile) {
        try {
          toast({
            status: "info",
            title: "Загрузка аватара...",
            duration: 2000,
            isClosable: true,
          });

          const { photoUrl } = await employeesAPI.uploadAvatar(
            employee.id,
            pendingAvatarFile
          );
          employeeData.photoUrl = photoUrl;

          toast({
            status: "success",
            title: "Аватар загружен",
            duration: 2000,
            isClosable: true,
          });
        } catch (avatarError) {
          toast({
            status: "warning",
            title: "Ошибка загрузки аватара",
            description:
              avatarError instanceof Error
                ? avatarError.message
                : "Не удалось загрузить аватар",
            duration: 5000,
            isClosable: true,
          });
        }
      }

      onSave(employeeData);
      setShowSaveConfirm(false);
      setPendingAvatarFile(null);
    } catch (error) {
      toast({
        status: "error",
        title: "Ошибка сохранения",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить данные",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveConfirm(false);
  };

  const skillsText = Array.isArray(formData.skills)
    ? formData.skills.join(", ")
    : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {employee
            ? "Редактирование данных сотрудника"
            : "Добавление нового сотрудника"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {employee && (
              <Text fontSize="sm" color="gray.600">
                Вы можете изменить информацию о сотруднике ниже
              </Text>
            )}

            <SimpleGrid columns={2} spacing={6}>
              {/* Левая колонка - Личная информация */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                  Личная информация
                </Text>

                {/* Фото */}
                <FormControl>
                  <FormLabel>Фото</FormLabel>
                  <Box>
                    <AvatarUploader
                      fullName={
                        `${formData.lastName || ""} ${
                          formData.firstName || ""
                        } ${formData.middleName || ""}`.trim() ||
                        formData.name ||
                        "Новый сотрудник"
                      }
                      photoUrl={avatarPreview || formData.photoUrl}
                      onSelect={handleAvatarSelect}
                    />
                  </Box>
                </FormControl>

                {/* Фамилия */}
                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel>Фамилия *</FormLabel>
                  <HStack>
                    <Input
                      value={formData.lastName || ""}
                      onChange={(e) =>
                        handleFieldChange("lastName", e.target.value)
                      }
                      bg="gray.50"
                      maxLength={FIELD_MAX_LENGTHS.lastName}
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("lastName", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                </FormControl>

                {/* Имя */}
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel>Имя *</FormLabel>
                  <HStack>
                    <Input
                      value={formData.firstName || ""}
                      onChange={(e) =>
                        handleFieldChange("firstName", e.target.value)
                      }
                      bg="gray.50"
                      maxLength={FIELD_MAX_LENGTHS.firstName}
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("firstName", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                </FormControl>

                {/* Отчество */}
                <FormControl>
                  <FormLabel>Отчество</FormLabel>
                  <HStack>
                    <Input
                      value={formData.middleName || ""}
                      onChange={(e) =>
                        handleFieldChange("middleName", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("middleName", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Город */}
                <FormControl>
                  <FormLabel>Город</FormLabel>
                  <HStack>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) =>
                        handleFieldChange("city", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("city", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Контактная информация */}
                <Divider />
                <Text fontSize="lg" fontWeight="bold">
                  Контактная информация
                </Text>

                {/* Почта */}
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Почта *</FormLabel>
                  <HStack>
                    <Input
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      bg="gray.50"
                      type="email"
                      maxLength={FIELD_MAX_LENGTHS.email}
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("email", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                {/* Номер телефона */}
                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel>Номер телефона</FormLabel>
                  <HStack>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      bg="gray.50"
                      type="tel"
                      maxLength={FIELD_MAX_LENGTHS.phone}
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("phone", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>
              </VStack>

              {/* Правая колонка - Информация о работе */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                  Информация о работе
                </Text>

                {/* Должность */}
                <FormControl isInvalid={!!errors.position}>
                  <FormLabel>Должность</FormLabel>
                  <HStack>
                    <Input
                      value={formData.position || ""}
                      onChange={(e) =>
                        handleFieldChange("position", e.target.value)
                      }
                      bg="gray.50"
                      maxLength={FIELD_MAX_LENGTHS.position}
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("position", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.position}</FormErrorMessage>
                </FormControl>

                {/* Дата найма */}
                <FormControl isInvalid={!!errors.hireDate}>
                  <FormLabel>Дата найма</FormLabel>
                  <HStack>
                    <Input
                      value={formData.hireDate || ""}
                      onChange={(e) =>
                        handleFieldChange("hireDate", e.target.value)
                      }
                      bg="gray.50"
                      placeholder="DD.MM.YYYY"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("hireDate", "")}
                    />
                  </HStack>
                  <FormErrorMessage>{errors.hireDate}</FormErrorMessage>
                </FormControl>

                {/* Юридическое лицо */}
                <FormControl>
                  <FormLabel>Юридическое лицо</FormLabel>
                  <HStack>
                    <Input
                      value={formData.legalEntity || ""}
                      onChange={(e) =>
                        handleFieldChange("legalEntity", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("legalEntity", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Навыки */}
                <FormControl>
                  <FormLabel>Навыки</FormLabel>
                  <Textarea
                    value={skillsText}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    bg="gray.50"
                    placeholder="Введите навыки через запятую"
                    rows={2}
                  />
                </FormControl>

                {/* Подразделение */}
                <FormControl>
                  <FormLabel>Подразделение</FormLabel>
                  <HStack>
                    <Input
                      value={formData.department || ""}
                      onChange={(e) =>
                        handleFieldChange("department", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("department", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Описание */}
                <FormControl>
                  <FormLabel>Описание</FormLabel>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    bg="gray.50"
                    rows={3}
                  />
                </FormControl>

                {/* Группа */}
                <FormControl>
                  <FormLabel>Группа</FormLabel>
                  <HStack>
                    <Input
                      value={formData.group || ""}
                      onChange={(e) =>
                        handleFieldChange("group", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("group", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Руководитель */}
                <FormControl>
                  <FormLabel>Руководитель</FormLabel>
                  <HStack>
                    <Input
                      value={formData.managerName || ""}
                      onChange={(e) =>
                        handleFieldChange("managerName", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("managerName", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Другое */}
                <Divider />
                <Text fontSize="lg" fontWeight="bold">
                  Другое
                </Text>

                {/* Комментарий */}
                <FormControl>
                  <FormLabel>Комментарий</FormLabel>
                  <Textarea
                    value={formData.comment || ""}
                    onChange={(e) =>
                      handleFieldChange("comment", e.target.value)
                    }
                    bg="gray.50"
                    placeholder="Введите текст..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </SimpleGrid>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            bg="#763186"
            color="white"
            _hover={{ bg: "#5e2770" }}
            mr={3}
            onClick={handleSaveClick}
          >
            Сохранить
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Модальное окно подтверждения сохранения */}
      <Modal
        isOpen={showSaveConfirm}
        onClose={handleCancelSave}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сохранить изменения?</ModalHeader>
          <ModalBody>
            <Text>Вы уверены, что хотите применить изменения?</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              bg="#763186"
              color="white"
              _hover={{ bg: "#5e2770" }}
              mr={3}
              onClick={handleConfirmSave}
              isLoading={isSaving}
              loadingText="Сохранение..."
            >
              Да
            </Button>
            <Button variant="ghost" onClick={handleCancelSave}>
              Нет
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
};

export default EmployeeEditModal;
