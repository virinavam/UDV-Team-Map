import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  SimpleGrid,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import MainLayout from "../components/MainLayout";
import AvatarUploader from "../components/profile/AvatarUploader";
import type { Employee } from "../types/types";
import { employeesAPI, authAPI } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
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

type Step = 1 | 2 | 3;

const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const {
    isOpen: isSaveConfirmOpen,
    onOpen: onSaveConfirmOpen,
    onClose: onSaveConfirmClose,
  } = useDisclosure();

  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: "",
    lastName: "",
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
    mattermost: "",
    telegram: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (
      formData.description &&
      !validateMaxLength(formData.description, FIELD_MAX_LENGTHS.description)
    ) {
      newErrors.description = `Описание не должно превышать ${FIELD_MAX_LENGTHS.description} символов`;
    }
    if (
      formData.department &&
      !validateMaxLength(formData.department, FIELD_MAX_LENGTHS.department)
    ) {
      newErrors.department = `Подразделение не должно превышать ${FIELD_MAX_LENGTHS.department} символов`;
    }
    if (
      formData.group &&
      !validateMaxLength(formData.group, FIELD_MAX_LENGTHS.group)
    ) {
      newErrors.group = `Группа не должна превышать ${FIELD_MAX_LENGTHS.group} символов`;
    }
    if (
      formData.managerName &&
      !validateMaxLength(formData.managerName, FIELD_MAX_LENGTHS.managerName)
    ) {
      newErrors.managerName = `Руководитель не должен превышать ${FIELD_MAX_LENGTHS.managerName} символов`;
    }
    if (
      formData.legalEntity &&
      !validateMaxLength(formData.legalEntity, FIELD_MAX_LENGTHS.legalEntity)
    ) {
      newErrors.legalEntity = `Юридическое лицо не должно превышать ${FIELD_MAX_LENGTHS.legalEntity} символов`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
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

    try {
      // Обрезаем пробелы из всех строковых полей
      const trimmedData = {
        ...formData,
        firstName: trimAndValidate(formData.firstName),
        lastName: trimAndValidate(formData.lastName),
        email: trimAndValidate(formData.email),
        phone: trimAndValidate(formData.phone),
        city: trimAndValidate(formData.city),
        position: trimAndValidate(formData.position),
        telegram: trimAndValidate(formData.telegram),
        mattermost: trimAndValidate(formData.mattermost),
        description: trimAndValidate(formData.description),
        managerName: trimAndValidate(formData.managerName),
        group: trimAndValidate(formData.group),
        legalEntity: trimAndValidate(formData.legalEntity),
        department: trimAndValidate(formData.department),
      };

      // Шаг 1: Регистрируем нового пользователя через POST /api/auth/register
      // Генерируем временный пароль (пользователь сможет изменить его позже)
      const tempPassword = `Temp${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      toast({
        status: "info",
        title: "Регистрация сотрудника...",
        description: "Пожалуйста, подождите",
        duration: 2000,
        isClosable: true,
      });

      const registerResponse = await authAPI.register({
        email: trimmedData.email || "",
        password: tempPassword,
        first_name: trimmedData.firstName || "",
        last_name: trimmedData.lastName || "",
      });

      // user_id может быть UUID объектом или строкой
      let userId: string;
      if (typeof registerResponse.user_id === "string") {
        userId = registerResponse.user_id;
      } else if (
        registerResponse.user_id &&
        typeof registerResponse.user_id === "object" &&
        "toString" in registerResponse.user_id
      ) {
        userId = registerResponse.user_id.toString();
      } else {
        userId = String(registerResponse.user_id);
      }

      if (!userId || userId === "undefined" || userId === "null") {
        throw new Error(
          "Не удалось получить ID пользователя после регистрации"
        );
      }

      if ((import.meta as any).env?.DEV) {
        console.log("[AddEmployeePage] Registered user ID:", userId);
        console.log("[AddEmployeePage] Register response:", registerResponse);
      }

      // Шаг 2: Загружаем фото, если есть (POST /api/employees/{user_id}/avatar/upload)
      if (photoFile) {
        try {
          toast({
            status: "info",
            title: "Загрузка фото...",
            description: "Пожалуйста, подождите",
            duration: 2000,
            isClosable: true,
          });

          // Проверяем, является ли пользователь админом или HR
          const currentUser = await authAPI.getCurrentUser();
          const isAdmin =
            currentUser?.role === "SYSTEM_ADMIN" ||
            currentUser?.role === "HR_ADMIN";

          // Загружаем аватар
          await employeesAPI.uploadAvatar(
            userId,
            photoFile,
            isAdmin // Для админов/HR используем no_moderation
          );

          // ВАЖНО: Получаем обновленные данные сотрудника из бэка, чтобы получить актуальный photo_url
          // Делаем небольшую задержку, чтобы бэк успел обработать загрузку
          await new Promise((resolve) => setTimeout(resolve, 500));

          try {
            const refreshedEmployee = await employeesAPI.getById(userId);
            if (refreshedEmployee?.photoUrl) {
              // Обновляем photoPreview с актуальными данными из бэка
              setPhotoPreview(refreshedEmployee.photoUrl);
            }
          } catch (refreshError) {
            console.warn(
              "Не удалось получить обновленные данные сотрудника после загрузки аватара:",
              refreshError
            );
          }

          toast({
            status: "success",
            title: "Фото загружено",
            duration: 2000,
            isClosable: true,
          });
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
          toast({
            status: "warning",
            title: "Сотрудник создан, но фото не загружено",
            description:
              error instanceof Error
                ? error.message
                : "Не удалось загрузить фото",
            duration: 5000,
            isClosable: true,
          });
        }
      }

      // Шаг 3: Обновляем данные сотрудника через PUT /api/employees/{user_id}
      // Подготавливаем данные для обновления
      const updateData: Partial<Employee> = {
        city: trimmedData.city || undefined,
        position: trimmedData.position || undefined,
        phone: trimmedData.phone || undefined,
        telegram: trimmedData.telegram || undefined,
        mattermost: trimmedData.mattermost || undefined,
        description: trimmedData.description || undefined,
        managerName: trimmedData.managerName || undefined,
        group: trimmedData.group || undefined,
        legalEntity: trimmedData.legalEntity || undefined,
        department: trimmedData.department || undefined,
        skills: (() => {
          const skillsValue: string[] | string | undefined = trimmedData.skills;
          if (Array.isArray(skillsValue)) {
            return skillsValue;
          }
          if (typeof skillsValue === "string") {
            return skillsValue
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
          return [];
        })(),
      };

      // Удаляем undefined значения
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof Employee] === undefined) {
          delete updateData[key as keyof Employee];
        }
      });

      // Обновляем данные только если есть что обновлять
      if (Object.keys(updateData).length > 0) {
        try {
          await employeesAPI.update(userId, updateData);
        } catch (error) {
          console.error("Ошибка обновления данных сотрудника:", error);
          toast({
            status: "warning",
            title: "Сотрудник создан, но не все данные обновлены",
            description:
              error instanceof Error
                ? error.message
                : "Не удалось обновить некоторые данные",
            duration: 5000,
            isClosable: true,
          });
        }
      }

      toast({
        status: "success",
        title: "Сотрудник добавлен",
        description: "Новый сотрудник успешно добавлен в систему",
        duration: 3000,
        isClosable: true,
      });

      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate("/hr-data");
    } catch (error) {
      console.error("Ошибка добавления сотрудника:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось добавить сотрудника";
      toast({
        status: "error",
        title: "Ошибка",
        description: errorMessage,
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSaveClick = () => {
    onSaveConfirmOpen();
  };

  const handleConfirmSave = () => {
    onSaveConfirmClose();
    handleSave();
  };

  const handleSkillsChange = (value: string) => {
    const skills = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    handleFieldChange("skills", skills);
  };

  const skillsText = Array.isArray(formData.skills)
    ? formData.skills.join(", ")
    : "";

  const fullName =
    `${formData.lastName || ""} ${formData.firstName || ""}`.trim() ||
    "Новый сотрудник";

  return (
    <MainLayout>
      <Box bg="white" minH="calc(100vh - 80px)">
        <Box p={6} maxW="800px" mx="auto">
          <VStack spacing={6} align="stretch">
            {/* Кнопка Назад */}
            <HStack spacing={4} align="flex-start">
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="outline"
                onClick={handleBack}
                color="#763186"
                borderColor="gray.300"
                _hover={{ bg: "purple.50", borderColor: "gray.400" }}
                fontWeight="normal"
              >
                Назад
              </Button>
            </HStack>

            {/* Заголовок по центру */}
            <VStack spacing={1} align="center">
              <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                Добавление нового сотрудника
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Вы можете добавить информацию о новом сотруднике ниже
              </Text>
            </VStack>

            {/* Индикатор прогресса */}
            <HStack spacing={4} justify="center" py={4}>
              <VStack spacing={2}>
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={currentStep >= 1 ? "#763186" : "gray.300"}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                >
                  1
                </Box>
                <Text
                  fontSize="sm"
                  color={currentStep >= 1 ? "#763186" : "gray.500"}
                  fontWeight={currentStep === 1 ? "bold" : "normal"}
                >
                  Личная информация
                </Text>
              </VStack>
              <Box
                w="100px"
                h="2px"
                bg={currentStep >= 2 ? "#763186" : "gray.300"}
              />
              <VStack spacing={2}>
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={currentStep >= 2 ? "#763186" : "gray.300"}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                >
                  2
                </Box>
                <Text
                  fontSize="sm"
                  color={currentStep >= 2 ? "#763186" : "gray.500"}
                  fontWeight={currentStep === 2 ? "bold" : "normal"}
                >
                  Информация о работе
                </Text>
              </VStack>
              <Box
                w="100px"
                h="2px"
                bg={currentStep >= 3 ? "#763186" : "gray.300"}
              />
              <VStack spacing={2}>
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg={currentStep >= 3 ? "#763186" : "gray.300"}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                >
                  3
                </Box>
                <Text
                  fontSize="sm"
                  color={currentStep >= 3 ? "#763186" : "gray.500"}
                  fontWeight={currentStep === 3 ? "bold" : "normal"}
                >
                  Контактная информация
                </Text>
              </VStack>
            </HStack>

            {/* Форма */}
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              minH="700px"
              display="flex"
              flexDirection="column"
            >
              {currentStep === 1 && (
                <VStack
                  spacing={6}
                  align="center"
                  p={6}
                  flex={1}
                  justify="space-between"
                >
                  <VStack spacing={6} align="center" w="100%">
                    <VStack spacing={4} align="stretch" w="100%" maxW="400px">
                      <FormControl isInvalid={!!errors.lastName}>
                        <FormLabel>Фамилия *</FormLabel>
                        <Input
                          value={formData.lastName || ""}
                          onChange={(e) =>
                            handleFieldChange("lastName", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                          maxLength={FIELD_MAX_LENGTHS.lastName}
                        />
                        <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                      </FormControl>
                      <FormControl isInvalid={!!errors.firstName}>
                        <FormLabel>Имя *</FormLabel>
                        <Input
                          value={formData.firstName || ""}
                          onChange={(e) =>
                            handleFieldChange("firstName", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                          maxLength={FIELD_MAX_LENGTHS.firstName}
                        />
                        <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                      </FormControl>
                      <FormControl isInvalid={!!errors.city}>
                        <FormLabel>Город</FormLabel>
                        <Input
                          value={formData.city || ""}
                          onChange={(e) =>
                            handleFieldChange("city", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                          maxLength={FIELD_MAX_LENGTHS.city}
                        />
                        <FormErrorMessage>{errors.city}</FormErrorMessage>
                      </FormControl>
                      {/* Фото внизу */}
                      <FormControl w="100%" maxW="400px">
                        <FormLabel>Фото</FormLabel>
                        <Box display="flex" justifyContent="center">
                          <AvatarUploader
                            fullName={fullName}
                            photoUrl={photoPreview || undefined}
                            onSelect={handlePhotoSelect}
                          />
                        </Box>
                      </FormControl>
                    </VStack>
                  </VStack>
                  {/* Кнопка Далее внизу */}
                  <HStack justify="center" w="100%" pt={4}>
                    <Button
                      bg="#763186"
                      color="white"
                      _hover={{ bg: "#5e2770" }}
                      size="lg"
                      onClick={handleNext}
                    >
                      Далее
                    </Button>
                  </HStack>
                </VStack>
              )}

              {currentStep === 2 && (
                <VStack
                  spacing={6}
                  align="stretch"
                  p={6}
                  flex={1}
                  justify="space-between"
                >
                  <VStack spacing={6} align="stretch" w="100%">
                    <SimpleGrid columns={2} spacing={6}>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.position}>
                          <FormLabel>Должность</FormLabel>
                          <Input
                            value={formData.position || ""}
                            onChange={(e) =>
                              handleFieldChange("position", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.position}
                          />
                          <FormErrorMessage>{errors.position}</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.legalEntity}>
                          <FormLabel>Юридическое лицо</FormLabel>
                          <Input
                            value={formData.legalEntity || ""}
                            onChange={(e) =>
                              handleFieldChange("legalEntity", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.legalEntity}
                          />
                          <FormErrorMessage>
                            {errors.legalEntity}
                          </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.department}>
                          <FormLabel>Подразделение</FormLabel>
                          <Input
                            value={formData.department || ""}
                            onChange={(e) =>
                              handleFieldChange("department", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.department}
                          />
                          <FormErrorMessage>
                            {errors.department}
                          </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.group}>
                          <FormLabel>Группа</FormLabel>
                          <Input
                            value={formData.group || ""}
                            onChange={(e) =>
                              handleFieldChange("group", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.group}
                          />
                          <FormErrorMessage>{errors.group}</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.managerName}>
                          <FormLabel>Руководитель</FormLabel>
                          <Input
                            value={formData.managerName || ""}
                            onChange={(e) =>
                              handleFieldChange("managerName", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.managerName}
                          />
                          <FormErrorMessage>
                            {errors.managerName}
                          </FormErrorMessage>
                        </FormControl>
                      </VStack>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.hireDate}>
                          <FormLabel>Дата найма</FormLabel>
                          <Input
                            value={formData.hireDate || ""}
                            onChange={(e) =>
                              handleFieldChange("hireDate", e.target.value)
                            }
                            placeholder="DD.MM.YYYY"
                            bg="gray.50"
                          />
                          <FormErrorMessage>{errors.hireDate}</FormErrorMessage>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Навыки</FormLabel>
                          <Textarea
                            value={skillsText}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            placeholder="Введите текст..."
                            bg="gray.50"
                            rows={3}
                          />
                        </FormControl>
                        <FormControl isInvalid={!!errors.description}>
                          <FormLabel>Описание</FormLabel>
                          <Textarea
                            value={formData.description || ""}
                            onChange={(e) =>
                              handleFieldChange("description", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            rows={4}
                            maxLength={FIELD_MAX_LENGTHS.description}
                          />
                          <FormErrorMessage>
                            {errors.description}
                          </FormErrorMessage>
                        </FormControl>
                      </VStack>
                    </SimpleGrid>
                  </VStack>
                  {/* Кнопка Далее внизу */}
                  <HStack justify="center" w="100%" pt={4}>
                    <Button
                      bg="#763186"
                      color="white"
                      _hover={{ bg: "#5e2770" }}
                      size="lg"
                      onClick={handleNext}
                    >
                      Далее
                    </Button>
                  </HStack>
                </VStack>
              )}

              {currentStep === 3 && (
                <VStack
                  spacing={6}
                  align="stretch"
                  p={6}
                  flex={1}
                  justify="space-between"
                >
                  <VStack spacing={6} align="stretch" w="100%">
                    <SimpleGrid columns={2} spacing={6}>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.email}>
                          <FormLabel>Почта *</FormLabel>
                          <Input
                            value={formData.email || ""}
                            onChange={(e) =>
                              handleFieldChange("email", e.target.value)
                            }
                            placeholder="example@mail.com"
                            bg="gray.50"
                            type="email"
                            maxLength={FIELD_MAX_LENGTHS.email}
                          />
                          <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.phone}>
                          <FormLabel>Номер телефона</FormLabel>
                          <Input
                            value={formData.phone || ""}
                            onChange={(e) =>
                              handleFieldChange("phone", e.target.value)
                            }
                            placeholder="+7 (999) 123-45-67"
                            bg="gray.50"
                            type="tel"
                            maxLength={FIELD_MAX_LENGTHS.phone}
                          />
                          <FormErrorMessage>{errors.phone}</FormErrorMessage>
                        </FormControl>
                      </VStack>
                      <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!!errors.mattermost}>
                          <FormLabel>Mattermost</FormLabel>
                          <Input
                            value={formData.mattermost || ""}
                            onChange={(e) =>
                              handleFieldChange("mattermost", e.target.value)
                            }
                            placeholder="Введите текст..."
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.mattermost}
                          />
                          <FormErrorMessage>
                            {errors.mattermost}
                          </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!!errors.telegram}>
                          <FormLabel>Telegram</FormLabel>
                          <Input
                            value={formData.telegram || ""}
                            onChange={(e) =>
                              handleFieldChange("telegram", e.target.value)
                            }
                            placeholder="@username"
                            bg="gray.50"
                            maxLength={FIELD_MAX_LENGTHS.telegram}
                          />
                          <FormErrorMessage>{errors.telegram}</FormErrorMessage>
                        </FormControl>
                      </VStack>
                    </SimpleGrid>
                  </VStack>
                  {/* Кнопка Сохранить внизу */}
                  <HStack justify="center" w="100%" pt={4}>
                    <Button
                      bg="#763186"
                      color="white"
                      _hover={{ bg: "#5e2770" }}
                      size="lg"
                      onClick={handleSaveClick}
                    >
                      Сохранить
                    </Button>
                  </HStack>
                </VStack>
              )}
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Модальное окно подтверждения сохранения */}
      <Modal
        isOpen={isSaveConfirmOpen}
        onClose={onSaveConfirmClose}
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
            >
              Да
            </Button>
            <Button variant="ghost" onClick={onSaveConfirmClose}>
              Нет
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

export default AddEmployeePage;
