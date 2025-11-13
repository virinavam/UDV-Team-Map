import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Checkbox,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Badge,
  Divider,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import MainLayout from "../components/MainLayout";
import { mockEmployees } from "../lib/mock-data";
import type { Employee } from "../types/types";

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    isOpen: isSaveDialogOpen,
    onOpen: onSaveDialogOpen,
    onClose: onSaveDialogClose,
  } = useDisclosure();

  const {
    isOpen: isCancelDialogOpen,
    onOpen: onCancelDialogOpen,
    onClose: onCancelDialogClose,
  } = useDisclosure();

  useEffect(() => {
    const foundEmployee = mockEmployees.find((e) => e.id === id);
    if (foundEmployee) {
      setEmployee(foundEmployee);
      setEditedEmployee({ ...foundEmployee });
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditMode(true);
    setHasChanges(false);
  };

  const handleFieldChange = (field: keyof Employee, value: any) => {
    if (editedEmployee) {
      setEditedEmployee({ ...editedEmployee, [field]: value });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    onSaveDialogOpen();
  };

  const confirmSave = () => {
    if (editedEmployee) {
      setEmployee(editedEmployee);
      setIsEditMode(false);
      setHasChanges(false);
      onSaveDialogClose();
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      onCancelDialogOpen();
    } else {
      setIsEditMode(false);
      setEditedEmployee(employee ? { ...employee } : null);
    }
  };

  const confirmCancel = () => {
    setIsEditMode(false);
    setEditedEmployee(employee ? { ...employee } : null);
    setHasChanges(false);
    onCancelDialogClose();
  };

  const handleBack = () => {
    if (isEditMode && hasChanges) {
      onCancelDialogOpen();
    } else {
      navigate(-1);
    }
  };

  if (!employee) {
    return (
      <MainLayout>
        <Box p={6}>
          <Text>Профиль не найден</Text>
        </Box>
      </MainLayout>
    );
  }

  const displayEmployee = isEditMode ? editedEmployee : employee;

  if (!displayEmployee) return null;

  const fullName = `${displayEmployee.lastName || ""} ${displayEmployee.firstName || ""} ${displayEmployee.middleName || ""}`.trim();

  return (
    <MainLayout>
      <Box p={6}>
        <HStack spacing={4} mb={6} justify="space-between">
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={handleBack}
            colorScheme="purple"
          >
            Назад
          </Button>
          {!isEditMode && (
            <Button
              leftIcon={<EditIcon />}
              variant="outline"
              onClick={handleEdit}
              colorScheme="purple"
            >
              Редактировать
            </Button>
          )}
        </HStack>

        <Box bg="white" borderRadius="lg" p={8} boxShadow="sm">
          {isEditMode ? (
            <EditMode
              employee={displayEmployee}
              onFieldChange={handleFieldChange}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <ViewMode employee={displayEmployee} fullName={fullName} />
          )}
        </Box>
      </Box>

      {/* Диалог подтверждения сохранения */}
      <Modal isOpen={isSaveDialogOpen} onClose={onSaveDialogClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сохранить изменения?</ModalHeader>
          <ModalBody>
            <Text>Примененные изменения будут отправлены на проверку модератору</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" mr={3} onClick={confirmSave}>
              Да
            </Button>
            <Button variant="ghost" onClick={onSaveDialogClose}>
              Нет
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Диалог подтверждения отмены */}
      <Modal isOpen={isCancelDialogOpen} onClose={onCancelDialogClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Не сохранять изменения?</ModalHeader>
          <ModalBody>
            <Text>Внесенные изменения будут потеряны</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" mr={3} onClick={confirmCancel}>
              Да
            </Button>
            <Button variant="ghost" onClick={onCancelDialogClose}>
              Нет
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

// Режим просмотра
const ViewMode: React.FC<{ employee: Employee; fullName: string }> = ({
  employee,
  fullName,
}) => {
  return (
    <VStack spacing={6} align="stretch">
      {/* Верхний блок - Шапка профиля */}
      <Box>
        <HStack spacing={6} align="start">
          {/* Фото профиля */}
          <Box>
            <Avatar
              size="2xl"
              name={fullName}
              src={employee.photoUrl}
              borderRadius="md"
            />
          </Box>
          {/* Информация о профиле */}
          <Box flex={1}>
            <Text fontSize="3xl" fontWeight="bold" mb={4}>
              {fullName}
            </Text>
            <SimpleGrid columns={2} spacing={4} columnGap={8}>
              <VStack align="start" spacing={2}>
                <Text fontWeight="semibold" color="gray.700">
                  Дата рождения
                </Text>
                <Text>{employee.dateOfBirth || "-"}</Text>
              </VStack>
              <VStack align="start" spacing={2}>
                <Text fontWeight="semibold" color="gray.700">
                  Город
                </Text>
                <Text>{employee.city || "-"}</Text>
              </VStack>
              <VStack align="start" spacing={2}>
                <Text fontWeight="semibold" color="gray.700">
                  Навыки
                </Text>
                <HStack spacing={1} flexWrap="wrap">
                  {employee.skills.map((skill, idx) => (
                    <React.Fragment key={skill}>
                      <Text as="span" fontWeight="bold">
                        {skill}
                      </Text>
                      {idx < employee.skills.length - 1 && (
                        <Text as="span" mx={1}>
                          |
                        </Text>
                      )}
                    </React.Fragment>
                  ))}
                </HStack>
              </VStack>
              <VStack align="start" spacing={2}>
                <Text fontWeight="semibold" color="gray.700">
                  О себе
                </Text>
                <Text>{employee.aboutMe || "-"}</Text>
              </VStack>
            </SimpleGrid>
          </Box>
        </HStack>
      </Box>

      <Divider />

      {/* Информация о работе */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Информация о работе
        </Text>
        <SimpleGrid columns={2} spacing={4} columnGap={8}>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Должность
            </Text>
            <Text>{employee.position || "-"}</Text>
          </VStack>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Подразделение
            </Text>
            <Text>{employee.departmentFull || employee.department || "-"}</Text>
          </VStack>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Руководитель
            </Text>
            <Text>{employee.managerName || "-"}</Text>
          </VStack>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Стаж работы в компании
            </Text>
            <Text>{employee.workExperience || "-"}</Text>
          </VStack>
        </SimpleGrid>
      </Box>

      <Divider />

      {/* Контактная информация */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Контактная информация
        </Text>
        <SimpleGrid columns={2} spacing={4} columnGap={8}>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Почта
            </Text>
            <Text>{employee.email || "-"}</Text>
          </VStack>
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold" color="gray.700">
              Номер телефона
            </Text>
            <Text>{employee.phone || "-"}</Text>
          </VStack>
          {employee.mattermost && (
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold" color="gray.700">
                Mattermost
              </Text>
              <Text>{employee.mattermost}</Text>
            </VStack>
          )}
          {employee.telegram && (
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold" color="gray.700">
                Telegram
              </Text>
              <Text>{employee.telegram}</Text>
            </VStack>
          )}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

// Режим редактирования
const EditMode: React.FC<{
  employee: Employee;
  onFieldChange: (field: keyof Employee, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ employee, onFieldChange, onSave, onCancel }) => {
  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={6} align="start">
        {/* Блок загрузки фото */}
        <Box flex={1}>
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="md"
            p={6}
            textAlign="center"
          >
            <Avatar
              size="2xl"
              name={employee.name}
              src={employee.photoUrl}
              mb={4}
              borderRadius="md"
            />
            <Text mb={4} color="gray.600">
              Выберите файл или перетяните его сюда
            </Text>
            <VStack align="start" spacing={1} fontSize="sm" color="gray.600" pl={4}>
              <Text fontWeight="semibold" mb={2}>
                Требования к фото:
              </Text>
              <Text>1. На фото запечатлено Ваше лицо</Text>
              <Text>2. Хорошее качество</Text>
              <Text>3. Нейтральный фон</Text>
            </VStack>
          </Box>
        </Box>

        {/* Личная информация */}
        <Box flex={1}>
          <SimpleGrid columns={2} spacing={4}>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Фамилия</Text>
              <HStack w="100%">
                <Input
                  value={employee.lastName || ""}
                  onChange={(e) => onFieldChange("lastName", e.target.value)}
                  bg="gray.50"
                />
                <IconButton
                  aria-label="Очистить"
                  icon={<CloseIcon />}
                  size="sm"
                  onClick={() => onFieldChange("lastName", "")}
                />
              </HStack>
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Имя</Text>
              <Input
                value={employee.firstName || ""}
                onChange={(e) => onFieldChange("firstName", e.target.value)}
                bg="gray.50"
              />
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Отчество</Text>
              <Input
                value={employee.middleName || ""}
                onChange={(e) => onFieldChange("middleName", e.target.value)}
                bg="gray.50"
              />
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Дата рождения</Text>
              <Input
                value={employee.dateOfBirth || ""}
                onChange={(e) => onFieldChange("dateOfBirth", e.target.value)}
                bg="gray.50"
              />
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Город</Text>
              <HStack w="100%">
                <Input
                  value={employee.city || ""}
                  onChange={(e) => onFieldChange("city", e.target.value)}
                  bg="gray.50"
                />
                <IconButton
                  aria-label="Очистить"
                  icon={<CloseIcon />}
                  size="sm"
                  onClick={() => onFieldChange("city", "")}
                />
              </HStack>
            </VStack>
            <VStack align="start" spacing={2}>
              <Text fontWeight="semibold">Навыки</Text>
              <Input
                value={employee.skills.join(", ")}
                onChange={(e) =>
                  onFieldChange(
                    "skills",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Введите навыки через запятую"
                bg="gray.50"
              />
            </VStack>
          </SimpleGrid>
          <VStack align="start" spacing={2} mt={4}>
            <Text fontWeight="semibold">О себе</Text>
            <Textarea
              value={employee.aboutMe || ""}
              onChange={(e) => onFieldChange("aboutMe", e.target.value)}
              rows={3}
              bg="gray.50"
            />
          </VStack>
        </Box>
      </HStack>

      <Divider />

      {/* Информация о работе */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Информация о работе
        </Text>
        <VStack align="stretch" spacing={3}>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Должность</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.position || ""}
              onChange={(e) => onFieldChange("position", e.target.value)}
              bg="gray.50"
            />
          </Box>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Подразделение</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.departmentFull || employee.department || ""}
              onChange={(e) => onFieldChange("departmentFull", e.target.value)}
              bg="gray.50"
            />
          </Box>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Руководитель</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.managerName || ""}
              onChange={(e) => onFieldChange("managerName", e.target.value)}
              bg="gray.50"
            />
          </Box>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Стаж работы в компании</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.workExperience || ""}
              onChange={(e) => onFieldChange("workExperience", e.target.value)}
              bg="gray.50"
            />
          </Box>
        </VStack>
      </Box>

      <Divider />

      {/* Контактная информация */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Контактная информация
        </Text>
        <VStack align="stretch" spacing={3}>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Почта</Text>
          </HStack>
          <Box pl={8}>
            <HStack>
              <Input
                value={employee.email || ""}
                onChange={(e) => onFieldChange("email", e.target.value)}
                bg="gray.50"
              />
              <IconButton
                aria-label="Очистить"
                icon={<CloseIcon />}
                size="sm"
                onClick={() => onFieldChange("email", "")}
              />
            </HStack>
          </Box>
          <HStack>
            <Checkbox defaultChecked />
            <Text fontWeight="semibold">Номер телефона</Text>
          </HStack>
          <Box pl={8}>
            <HStack>
              <Input
                value={employee.phone || ""}
                onChange={(e) => onFieldChange("phone", e.target.value)}
                bg="gray.50"
              />
              <IconButton
                aria-label="Очистить"
                icon={<CloseIcon />}
                size="sm"
                onClick={() => onFieldChange("phone", "")}
              />
            </HStack>
          </Box>
          <HStack>
            <Checkbox />
            <Text fontWeight="semibold">Mattermost</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.mattermost || ""}
              onChange={(e) => onFieldChange("mattermost", e.target.value)}
              placeholder="Введите текст..."
              bg="gray.50"
            />
          </Box>
          <HStack>
            <Checkbox />
            <Text fontWeight="semibold">Telegram</Text>
          </HStack>
          <Box pl={8}>
            <Input
              value={employee.telegram || ""}
              onChange={(e) => onFieldChange("telegram", e.target.value)}
              placeholder="Введите текст..."
              bg="gray.50"
            />
          </Box>
        </VStack>
      </Box>

      {/* Кнопка сохранения */}
      <Flex justify="center" mt={8}>
        <Button colorScheme="purple" size="lg" onClick={onSave}>
          Сохранить
        </Button>
      </Flex>
    </VStack>
  );
};

export default ProfilePage;

