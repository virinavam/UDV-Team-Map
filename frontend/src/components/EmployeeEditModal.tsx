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
import SkillsSelector from "./SkillsSelector";
import { employeesAPI, skillsAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Проверяем, является ли пользователь админом или HR
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN";
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

  const handleSkillsChange = (skills: string[]) => {
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
        skills: Array.isArray(formData.skills) ? formData.skills : [],
      };

      // Создаем employeeData без навыков (они будут установлены отдельно через set_skills)
      const { skills, ...dataWithoutSkills } = trimmedData;
      const employeeData: Employee = {
        id: employee?.id || `e${Date.now()}`,
        name:
          `${trimmedData.lastName || ""} ${
            trimmedData.firstName || ""
          }`.trim() || "Новый сотрудник",
        position: trimmedData.position || "",
        city: trimmedData.city || "",
        email: trimmedData.email || "",
        skills: skills || [],
        status: trimmedData.status || "Активен",
        ...dataWithoutSkills, // остальные поля без навыков
      };

      console.log("=== ПОДГОТОВКА ДАННЫХ ===");
      console.log("formData.skills:", formData.skills);
      console.log("trimmedData.skills:", trimmedData.skills);
      console.log("employeeData.skills перед установкой:", employeeData.skills);
      console.log(
        "employeeData.skills - это массив?",
        Array.isArray(employeeData.skills)
      );
      console.log("employeeData.skills.length:", employeeData.skills?.length);

      // Если это редактирование существующего сотрудника и есть новый аватар
      if (employee?.id && pendingAvatarFile) {
        try {
          toast({
            status: "info",
            title: "Загрузка аватара...",
            duration: 2000,
            isClosable: true,
          });

          // Загружаем аватар
          await employeesAPI.uploadAvatar(
            employee.id,
            pendingAvatarFile,
            isAdmin // Для админов/HR используем no_moderation
          );

          // ВАЖНО: Получаем обновленные данные сотрудника из бэка, чтобы получить актуальный photo_url
          // Делаем небольшую задержку, чтобы бэк успел обработать загрузку
          await new Promise((resolve) => setTimeout(resolve, 500));

          const refreshedEmployee = await employeesAPI.getById(employee.id);

          // Обновляем avatarPreview с актуальными данными из бэка
          if (refreshedEmployee?.photoUrl) {
            setAvatarPreview(refreshedEmployee.photoUrl);
            handleFieldChange("photoUrl", refreshedEmployee.photoUrl);
          }

          toast({
            status: "success",
            title: isAdmin
              ? "Аватар загружен и активирован"
              : "Аватар загружен",
            description: isAdmin
              ? "Фотография активирована без модерации"
              : "Фотография отправлена на модерацию",
            duration: 2000,
            isClosable: true,
          });
        } catch (avatarError) {
          toast({
            status: "error",
            title: "Ошибка загрузки аватара",
            description:
              avatarError instanceof Error
                ? avatarError.message
                : "Не удалось загрузить аватар",
            duration: 5000,
            isClosable: true,
          });
          // Прерываем сохранение, если загрузка аватара не удалась
          setIsSaving(false);
          return;
        }
      }

      // Если это редактирование существующего сотрудника и пользователь - HR/админ,
      // устанавливаем навыки через set_skills ДО вызова onSave
      if (employee?.id && isAdmin && Array.isArray(employeeData.skills)) {
        try {
          console.log("=== УСТАНОВКА НАВЫКОВ ===");
          console.log("employee.id:", employee.id);
          console.log("employeeData.skills:", employeeData.skills);
          console.log("Длина массива навыков:", employeeData.skills.length);

          // Сначала получаем список всех существующих навыков из бэкенда
          let allSkills = await skillsAPI.list();
          console.log("Существующие навыки в БД:", allSkills);
          let existingSkillNames = new Set(
            allSkills.map((skill) => skill.name.toLowerCase())
          );

          // Создаем навыки, которых еще нет в базе
          const skillsToCreate = employeeData.skills.filter(
            (skillName) => !existingSkillNames.has(skillName.toLowerCase())
          );

          if (skillsToCreate.length > 0) {
            console.log("Создаем новые навыки:", skillsToCreate);
            // Создаем все недостающие навыки
            const createdSkills = await Promise.all(
              skillsToCreate.map(async (skillName) => {
                const created = await skillsAPI.create(skillName);
                console.log(`Создан навык: ${skillName} ->`, created);
                return created;
              })
            );
            console.log("Все созданные навыки:", createdSkills);

            // Перезагружаем список навыков после создания
            queryClient.invalidateQueries({ queryKey: ["skills"] });
            // Ждем немного и перезагружаем список
            await new Promise((resolve) => setTimeout(resolve, 200));
            allSkills = await skillsAPI.list();
            console.log(
              "Обновленный список навыков после создания:",
              allSkills
            );
            existingSkillNames = new Set(
              allSkills.map((skill) => skill.name.toLowerCase())
            );
          }

          // Проверяем, что все навыки теперь существуют
          const missingSkills = employeeData.skills.filter(
            (skillName) => !existingSkillNames.has(skillName.toLowerCase())
          );
          if (missingSkills.length > 0) {
            console.error(
              "ОШИБКА: Некоторые навыки все еще отсутствуют:",
              missingSkills
            );
            throw new Error(
              `Навыки не найдены в базе данных: ${missingSkills.join(", ")}`
            );
          }

          console.log(
            "Все навыки существуют, устанавливаем их:",
            employeeData.skills
          );
          // Теперь устанавливаем навыки (все они уже должны существовать в БД)
          const updatedWithSkills = await skillsAPI.setSkills(
            employee.id,
            employeeData.skills
          );
          console.log("Навыки установлены, получен ответ:", updatedWithSkills);
          console.log(
            "Навыки в ответе от set_skills:",
            updatedWithSkills.skills
          );

          // Обновляем employeeData с актуальными навыками ПЕРЕД обновлением кеша
          employeeData.skills = updatedWithSkills.skills || [];
          console.log(
            "employeeData.skills после обновления:",
            employeeData.skills
          );

          // Обновляем кеш с новыми данными сотрудника, включая навыки
          queryClient.setQueryData(
            ["employee", employee.id],
            updatedWithSkills
          );
          // Инвалидируем кеш списка сотрудников, чтобы обновить карточки
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          // Также инвалидируем кеш конкретного сотрудника
          queryClient.invalidateQueries({
            queryKey: ["employee", employee.id],
          });
        } catch (skillsError) {
          console.error("Ошибка при установке навыков:", skillsError);
          toast({
            status: "error",
            title: "Ошибка",
            description:
              skillsError instanceof Error
                ? skillsError.message
                : "Не удалось установить навыки",
            duration: 5000,
            isClosable: true,
          });
        }
      }

      // Обновляем кеш сотрудников после сохранения
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (employee?.id) {
        queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      }
      // Инвалидируем кэш карты, если изменился отдел
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });

      // Вызываем onSave после установки навыков (если они были установлены)
      onSave(employeeData);
      setShowSaveConfirm(false);
      setPendingAvatarFile(null);

      // ВАЖНО: После сохранения получаем обновленные данные сотрудника из бэка,
      // чтобы обновить avatarPreview с актуальным photoUrl
      if (employee?.id) {
        // Используем setTimeout, чтобы дать время бэку обработать запрос
        setTimeout(async () => {
          try {
            const refreshedEmployee = await employeesAPI.getById(employee.id);
            if (refreshedEmployee?.photoUrl) {
              setAvatarPreview(refreshedEmployee.photoUrl);
              handleFieldChange("photoUrl", refreshedEmployee.photoUrl);
            }
          } catch (refreshError) {
            console.warn(
              "Не удалось обновить данные сотрудника после сохранения:",
              refreshError
            );
          }
        }, 500);
      }
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
                        }`.trim() ||
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
                {isAdmin ? (
                  <SkillsSelector
                    selectedSkills={formData.skills || []}
                    onChange={handleSkillsChange}
                  />
                ) : (
                  <FormControl>
                    <FormLabel>Навыки</FormLabel>
                    <Textarea
                      value={
                        Array.isArray(formData.skills)
                          ? formData.skills.join(", ")
                          : ""
                      }
                      onChange={(e) => {
                        const skills = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        handleFieldChange("skills", skills);
                      }}
                      bg="gray.50"
                      placeholder="Введите навыки через запятую"
                      rows={2}
                      isReadOnly={!isAdmin}
                    />
                  </FormControl>
                )}

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
