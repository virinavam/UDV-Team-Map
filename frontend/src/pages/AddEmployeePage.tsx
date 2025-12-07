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
import { employeesAPI } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

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
    mattermost: "",
    telegram: "",
  });

  const handleFieldChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    try {
      // Создаем сотрудника
      const employeeData: Employee = {
        id: `e${Date.now()}`,
        name: `${formData.lastName || ""} ${formData.firstName || ""} ${
          formData.middleName || ""
        }`.trim() || "Новый сотрудник",
        position: formData.position || "",
        city: formData.city || "",
        email: formData.email || "",
        skills: Array.isArray(formData.skills)
          ? formData.skills
          : typeof formData.skills === "string"
          ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        status: "Активен",
        ...formData,
      };

      const created = await employeesAPI.create(employeeData);

      // Загружаем фото, если есть
      if (photoFile && created.id) {
        try {
          const { photoUrl } = await employeesAPI.uploadAvatar(
            created.id,
            photoFile
          );
          await employeesAPI.update(created.id, { photoUrl });
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
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
      toast({
        status: "error",
        title: "Ошибка",
        description: "Не удалось добавить сотрудника",
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

  const fullName = `${formData.lastName || ""} ${formData.firstName || ""} ${
    formData.middleName || ""
  }`.trim() || "Новый сотрудник";

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
          <Box bg="white" border="1px solid" borderColor="gray.300" borderRadius="md" minH="700px" display="flex" flexDirection="column">
            {currentStep === 1 && (
              <VStack spacing={6} align="center" p={6} flex={1} justify="space-between">
                <VStack spacing={6} align="center" w="100%">
                  <VStack spacing={4} align="stretch" w="100%" maxW="400px">
                    <FormControl>
                      <FormLabel>Фамилия</FormLabel>
                      <Input
                        value={formData.lastName || ""}
                        onChange={(e) =>
                          handleFieldChange("lastName", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Имя</FormLabel>
                      <Input
                        value={formData.firstName || ""}
                        onChange={(e) =>
                          handleFieldChange("firstName", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Отчество</FormLabel>
                      <Input
                        value={formData.middleName || ""}
                        onChange={(e) =>
                          handleFieldChange("middleName", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Город</FormLabel>
                      <Input
                        value={formData.city || ""}
                        onChange={(e) =>
                          handleFieldChange("city", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
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
              <VStack spacing={6} align="stretch" p={6} flex={1} justify="space-between">
                <VStack spacing={6} align="stretch" w="100%">
                <SimpleGrid columns={2} spacing={6}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Должность</FormLabel>
                      <Input
                        value={formData.position || ""}
                        onChange={(e) =>
                          handleFieldChange("position", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Юридическое лицо</FormLabel>
                      <Input
                        value={formData.legalEntity || ""}
                        onChange={(e) =>
                          handleFieldChange("legalEntity", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Подразделение</FormLabel>
                      <Input
                        value={formData.department || ""}
                        onChange={(e) =>
                          handleFieldChange("department", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Группа</FormLabel>
                      <Input
                        value={formData.group || ""}
                        onChange={(e) =>
                          handleFieldChange("group", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Руководитель</FormLabel>
                      <Input
                        value={formData.managerName || ""}
                        onChange={(e) =>
                          handleFieldChange("managerName", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
                    </FormControl>
                  </VStack>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Дата найма</FormLabel>
                      <Input
                        value={formData.hireDate || ""}
                        onChange={(e) =>
                          handleFieldChange("hireDate", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                      />
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
                    <FormControl>
                      <FormLabel>Описание</FormLabel>
                      <Textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                          handleFieldChange("description", e.target.value)
                        }
                        placeholder="Введите текст..."
                        bg="gray.50"
                        rows={4}
                      />
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
              <VStack spacing={6} align="stretch" p={6} flex={1} justify="space-between">
                <VStack spacing={6} align="stretch" w="100%">
                  <SimpleGrid columns={2} spacing={6}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Почта</FormLabel>
                        <Input
                          value={formData.email || ""}
                          onChange={(e) =>
                            handleFieldChange("email", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                          type="email"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Номер телефона</FormLabel>
                        <Input
                          value={formData.phone || ""}
                          onChange={(e) =>
                            handleFieldChange("phone", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                          type="tel"
                        />
                      </FormControl>
                    </VStack>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Mattermost</FormLabel>
                        <Input
                          value={formData.mattermost || ""}
                          onChange={(e) =>
                            handleFieldChange("mattermost", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Telegram</FormLabel>
                        <Input
                          value={formData.telegram || ""}
                          onChange={(e) =>
                            handleFieldChange("telegram", e.target.value)
                          }
                          placeholder="Введите текст..."
                          bg="gray.50"
                        />
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

