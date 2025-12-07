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
  Avatar,
  IconButton,
  SimpleGrid,
  Text,
  Box,
  Divider,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import type { Employee } from "../types/types";

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

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        skills: employee.skills || [],
      });
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
    }
  }, [employee, isOpen]);

  const handleFieldChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleConfirmSave = () => {
    const employeeData: Employee = {
      id: employee?.id || `e${Date.now()}`,
      name:
        `${formData.lastName || ""} ${formData.firstName || ""} ${
          formData.middleName || ""
        }`.trim() || "Новый сотрудник",
      position: formData.position || "",
      city: formData.city || "",
      email: formData.email || "",
      skills: formData.skills || [],
      status: formData.status || "Активен",
      ...formData, // остальные поля
    };

    onSave(employeeData);
    setShowSaveConfirm(false);
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
                  <HStack>
                    <Avatar
                      size="md"
                      name={formData.name || ""}
                      src={formData.photoUrl}
                    />
                    <Text fontSize="sm" color="gray.600">
                      {formData.photoUrl || "image.png"} 1,25 МБ
                    </Text>
                    {formData.photoUrl && (
                      <IconButton
                        aria-label="Удалить фото"
                        icon={<CloseIcon />}
                        size="sm"
                        onClick={() => handleFieldChange("photoUrl", "")}
                      />
                    )}
                  </HStack>
                </FormControl>

                {/* Фамилия */}
                <FormControl>
                  <FormLabel>Фамилия</FormLabel>
                  <HStack>
                    <Input
                      value={formData.lastName || ""}
                      onChange={(e) =>
                        handleFieldChange("lastName", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("lastName", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Имя */}
                <FormControl>
                  <FormLabel>Имя</FormLabel>
                  <HStack>
                    <Input
                      value={formData.firstName || ""}
                      onChange={(e) =>
                        handleFieldChange("firstName", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("firstName", "")}
                    />
                  </HStack>
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
                <FormControl>
                  <FormLabel>Почта</FormLabel>
                  <HStack>
                    <Input
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("email", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Номер телефона */}
                <FormControl>
                  <FormLabel>Номер телефона</FormLabel>
                  <HStack>
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("phone", "")}
                    />
                  </HStack>
                </FormControl>
              </VStack>

              {/* Правая колонка - Информация о работе */}
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="bold">
                  Информация о работе
                </Text>

                {/* Должность */}
                <FormControl>
                  <FormLabel>Должность</FormLabel>
                  <HStack>
                    <Input
                      value={formData.position || ""}
                      onChange={(e) =>
                        handleFieldChange("position", e.target.value)
                      }
                      bg="gray.50"
                    />
                    <IconButton
                      aria-label="Очистить"
                      icon={<CloseIcon />}
                      size="sm"
                      onClick={() => handleFieldChange("position", "")}
                    />
                  </HStack>
                </FormControl>

                {/* Дата найма */}
                <FormControl>
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
