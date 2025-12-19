import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Checkbox,
  CheckboxGroup,
  Box,
  useToast,
  Spinner,
  Divider,
  Select,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsAPI, employeesAPI } from "../lib/api";
import type { Employee } from "../types/types";

interface DepartmentManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: string;
  departmentName?: string;
  legalEntityId: string;
  parentId?: string | null;
  currentManagerId?: string | null;
}

const DepartmentManageModal: React.FC<DepartmentManageModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  legalEntityId,
  parentId,
  currentManagerId,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [subdepartmentName, setSubdepartmentName] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "subdepartment" | "employees" | "manager"
  >("subdepartment");

  // Флаг для определения режима создания нового отдела
  const isCreatingNewDepartment = !departmentId;

  // Загружаем всех сотрудников
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees", { scope: "department-manage" }],
    queryFn: () => employeesAPI.list(),
    enabled: isOpen && (activeTab === "employees" || activeTab === "manager"),
  });

  // Сбрасываем форму при закрытии
  useEffect(() => {
    if (!isOpen) {
      setNewDepartmentName("");
      setSubdepartmentName("");
      setSelectedEmployees([]);
      setSelectedManagerId(currentManagerId || "");
      setActiveTab("subdepartment");
    } else {
      // Устанавливаем текущего руководителя при открытии
      setSelectedManagerId(currentManagerId || "");
      // Если режим создания нового отдела, ставим фокус на создание самого отдела
      if (isCreatingNewDepartment) {
        setActiveTab("subdepartment");
      }
    }
  }, [isOpen, currentManagerId, isCreatingNewDepartment]);

  const handleCreateSubdepartment = async () => {
    if (!subdepartmentName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название подотдела",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentsAPI.create({
        name: subdepartmentName.trim(),
        legal_entity_id: legalEntityId,
        parent_id: departmentId || null,
      });
      toast({
        title: "Подотдел создан",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      setSubdepartmentName("");
      onClose();
    } catch (error: any) {
      console.error("Ошибка при создании подотдела:", error);
      toast({
        title: "Ошибка при создании подотдела",
        description: error?.message || "Не удалось создать подотдел",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция для создания нового отдела при юридическом лице
  const handleCreateNewDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название отдела",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentsAPI.create({
        name: newDepartmentName.trim(),
        legal_entity_id: legalEntityId,
        parent_id: null,
      });
      toast({
        title: "Отдел создан",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      setNewDepartmentName("");
      onClose();
    } catch (error: any) {
      console.error("Ошибка при создании отдела:", error);
      toast({
        title: "Ошибка при создании отдела",
        description: error?.message || "Не удалось создать отдел",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployees = async () => {
    if (!departmentId) {
      toast({
        title: "Ошибка",
        description: "Сначала создайте отдел",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedEmployees.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одного сотрудника",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Обновляем отдел для каждого выбранного сотрудника
      await Promise.all(
        selectedEmployees.map((employeeId) =>
          employeesAPI.update(employeeId, { departmentId })
        )
      );

      // Получаем обновленные данные каждого сотрудника через GET /api/employees/{user_id}
      await Promise.all(
        selectedEmployees.map((employeeId) => employeesAPI.getById(employeeId))
      );

      toast({
        title: "Сотрудники добавлены",
        description: `Добавлено сотрудников: ${selectedEmployees.length}. Сотрудники автоматически перемещены из предыдущих отделов.`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      // Инвалидируем кэш для обновления данных на карте
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      setSelectedEmployees([]);
      onClose();
    } catch (error: any) {
      console.error("Ошибка при добавлении сотрудников:", error);
      toast({
        title: "Ошибка при добавлении сотрудников",
        description: error?.message || "Не удалось добавить сотрудников",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateManager = async () => {
    if (!departmentId) {
      toast({
        title: "Ошибка",
        description: "Сначала создайте отдел",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentsAPI.update(departmentId, {
        manager_id: selectedManagerId || null,
      });

      // Если был выбран руководитель, получаем его обновленные данные через GET /api/employees/{user_id}
      if (selectedManagerId) {
        await employeesAPI.getById(selectedManagerId);
      }

      toast({
        title: "Руководитель обновлен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      onClose();
    } catch (error: any) {
      console.error("Ошибка при обновлении руководителя:", error);
      toast({
        title: "Ошибка при обновлении руководителя",
        description: error?.message || "Не удалось обновить руководителя",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция для удаления отдела
  const handleDeleteDepartment = async () => {
    if (!departmentId) {
      toast({
        title: "Ошибка",
        description: "Невозможно удалить отдел",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!window.confirm("Вы уверены, что хотите удалить этот отдел?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Используем PATCH запрос для удаления - отправляем пустое тело или флаг удаления
      // На самом деле нужно использовать DELETE эндпоинт, если он есть
      // Пока используем метод обновления с пустыми данными
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/departments/${departmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      }).then(res => {
        if (!res.ok) throw new Error("Не удалось удалить отдел");
      });

      toast({
        title: "Отдел удален",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Перезагружаем карту
      await queryClient.refetchQueries({ queryKey: ["departments"] });
      await queryClient.refetchQueries({ queryKey: ["legal-entities"] });
      onClose();
    } catch (error: any) {
      console.error("Ошибка при удалении отдела:", error);
      toast({
        title: "Ошибка при удалении отдела",
        description: error?.message || "Не удалось удалить отдел",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isCreatingNewDepartment
            ? "Создать новый отдел"
            : `Управление отделом: ${departmentName}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Если режим создания нового отдела, сначала показываем форму создания */}
            {isCreatingNewDepartment && (
              <>
                <FormControl>
                  <FormLabel>Название отдела</FormLabel>
                  <Input
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Введите название отдела"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isSubmitting) {
                        handleCreateNewDepartment();
                      }
                    }}
                  />
                </FormControl>

                <Button
                  bg="#763186"
                  color="white"
                  _hover={{ bg: "#5a2568" }}
                  onClick={handleCreateNewDepartment}
                  isLoading={isSubmitting}
                  isDisabled={!newDepartmentName.trim()}
                  width="full"
                >
                  Создать отдел
                </Button>

                <Divider />
              </>
            )}

            {/* Переключатель вкладок - показываем только когда отдел существует */}
            {!isCreatingNewDepartment && (
              <>
                <Box display="flex" gap={2} mb={4}>
                  <Button
                    size="sm"
                    bg={activeTab === "subdepartment" ? "#763186" : "white"}
                    color={activeTab === "subdepartment" ? "white" : "gray.700"}
                    border="1px solid"
                    borderColor={activeTab === "subdepartment" ? "#763186" : "gray.300"}
                    _hover={{ bg: activeTab === "subdepartment" ? "#5a2568" : "gray.50" }}
                    cursor="pointer"
                    transition="all 0.2s"
                    fontWeight={activeTab === "subdepartment" ? "600" : "500"}
                    onClick={() => setActiveTab("subdepartment")}
                  >
                    Создать подотдел
                  </Button>
                  <Button
                    size="sm"
                    bg={activeTab === "employees" ? "#763186" : "white"}
                    color={activeTab === "employees" ? "white" : "gray.700"}
                    border="1px solid"
                    borderColor={activeTab === "employees" ? "#763186" : "gray.300"}
                    _hover={{ bg: activeTab === "employees" ? "#5a2568" : "gray.50" }}
                    cursor="pointer"
                    transition="all 0.2s"
                    fontWeight={activeTab === "employees" ? "600" : "500"}
                    onClick={() => setActiveTab("employees")}
                  >
                    Добавить сотрудников
                  </Button>
                  <Button
                    size="sm"
                    bg={activeTab === "manager" ? "#763186" : "white"}
                    color={activeTab === "manager" ? "white" : "gray.700"}
                    border="1px solid"
                    borderColor={activeTab === "manager" ? "#763186" : "gray.300"}
                    _hover={{ bg: activeTab === "manager" ? "#5a2568" : "gray.50" }}
                    cursor="pointer"
                    transition="all 0.2s"
                    fontWeight={activeTab === "manager" ? "600" : "500"}
                    onClick={() => setActiveTab("manager")}
                  >
                    Руководитель
                  </Button>
                </Box>

                <Divider />

                {/* Вкладка создания подотдела */}
                {activeTab === "subdepartment" && (
                  <FormControl>
                    <FormLabel>Название подотдела</FormLabel>
                    <Input
                      value={subdepartmentName}
                      onChange={(e) => setSubdepartmentName(e.target.value)}
                      placeholder="Введите название подотдела"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !isSubmitting) {
                          handleCreateSubdepartment();
                        }
                      }}
                    />
                  </FormControl>
                )}

                {/* Вкладка выбора руководителя */}
                {activeTab === "manager" && (
                  <FormControl>
                    <FormLabel>Руководитель отдела</FormLabel>
                    {isEmployeesLoading ? (
                      <Box textAlign="center" py={4}>
                        <Spinner size="lg" color="#763186.500" />
                      </Box>
                    ) : (
                      <Select
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        placeholder="Выберите руководителя отдела"
                      >
                        <option value="">Нет руководителя</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.lastName} {employee.firstName}
                            {employee.position && ` - ${employee.position}`}
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                )}

                {/* Вкладка добавления сотрудников */}
                {activeTab === "employees" && (
                  <Box>
                    <Text mb={3} fontWeight="semibold">
                      Выберите сотрудников для добавления в отдел:
                    </Text>
                    {isEmployeesLoading ? (
                      <Box textAlign="center" py={4}>
                        <Spinner size="lg" color="#763186.500" />
                      </Box>
                    ) : (
                      <CheckboxGroup
                        value={selectedEmployees}
                        onChange={(values) =>
                          setSelectedEmployees(values as string[])
                        }
                      >
                        <VStack
                          align="stretch"
                          spacing={2}
                          maxH="400px"
                          overflowY="auto"
                        >
                          {employees
                            .filter((emp) => {
                              // Показываем только сотрудников, которые не в этом отделе
                              // Если у сотрудника нет отдела (departmentId пустой/null/undefined), он доступен для добавления
                              return (
                                !emp.departmentId ||
                                emp.departmentId !== departmentId
                              );
                            })
                            .map((employee) => {
                              const isInOtherDepartment =
                                employee.departmentId &&
                                employee.departmentId !== departmentId;
                              return (
                                <Checkbox
                                  key={employee.id}
                                  value={employee.id}
                                >
                                  <HStack spacing={2}>
                                    <Text>
                                      {employee.lastName} {employee.firstName}
                                      {employee.position &&
                                        ` - ${employee.position}`}
                                    </Text>
                                    {isInOtherDepartment && (
                                      <Text
                                        fontSize="xs"
                                        color="orange.500"
                                        fontStyle="italic"
                                      >
                                        (в другом отделе)
                                      </Text>
                                    )}
                                  </HStack>
                                </Checkbox>
                              );
                            })}
                        </VStack>
                      </CheckboxGroup>
                    )}
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Отмена
          </Button>
          {!isCreatingNewDepartment && (
            <Button
              colorScheme="red"
              variant="outline"
              mr={3}
              onClick={handleDeleteDepartment}
              isLoading={isSubmitting}
            >
              Удалить отдел
            </Button>
          )}
          {isCreatingNewDepartment ? null : (
            <Button
              bg="#763186"
              color="white"
              _hover={{ bg: "#5a2568" }}
              onClick={
                activeTab === "subdepartment"
                  ? handleCreateSubdepartment
                  : activeTab === "employees"
                  ? handleAddEmployees
                  : handleUpdateManager
              }
              isLoading={isSubmitting}
              isDisabled={
                activeTab === "subdepartment"
                  ? !subdepartmentName.trim()
                  : activeTab === "employees"
                  ? selectedEmployees.length === 0
                  : false
              }
            >
              {activeTab === "subdepartment"
                ? "Создать подотдел"
                : activeTab === "employees"
                ? "Добавить сотрудников"
                : "Сохранить руководителя"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DepartmentManageModal;
