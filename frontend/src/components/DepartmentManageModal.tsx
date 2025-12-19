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
  departmentId: string;
  departmentName: string;
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
  const [subdepartmentName, setSubdepartmentName] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "subdepartment" | "employees" | "manager"
  >("subdepartment");

  // Загружаем всех сотрудников
  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["employees", { scope: "department-manage" }],
    queryFn: () => employeesAPI.list(),
    enabled: isOpen && (activeTab === "employees" || activeTab === "manager"),
  });

  // Сбрасываем форму при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSubdepartmentName("");
      setSelectedEmployees([]);
      setSelectedManagerId(currentManagerId || "");
      setActiveTab("subdepartment");
    } else {
      // Устанавливаем текущего руководителя при открытии
      setSelectedManagerId(currentManagerId || "");
    }
  }, [isOpen, currentManagerId]);

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
        parent_id: departmentId,
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

  const handleAddEmployees = async () => {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Управление отделом: {departmentName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Переключатель вкладок */}
            <Box display="flex" gap={2} mb={4}>
              <Button
                size="sm"
                variant={activeTab === "subdepartment" ? "solid" : "outline"}
                colorScheme={activeTab === "subdepartment" ? "#763186" : "gray"}
                onClick={() => setActiveTab("subdepartment")}
              >
                Создать подотдел
              </Button>
              <Button
                size="sm"
                variant={activeTab === "employees" ? "solid" : "outline"}
                colorScheme={activeTab === "employees" ? "#763186" : "gray"}
                onClick={() => setActiveTab("employees")}
              >
                Добавить сотрудников
              </Button>
              <Button
                size="sm"
                variant={activeTab === "manager" ? "solid" : "outline"}
                colorScheme={activeTab === "manager" ? "#763186" : "gray"}
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
                            <Checkbox key={employee.id} value={employee.id}>
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
                    {employees.filter(
                      (emp) =>
                        !emp.departmentId || emp.departmentId !== departmentId
                    ).length === 0 && (
                      <Text color="gray.500" textAlign="center" py={4}>
                        Нет доступных сотрудников для добавления
                      </Text>
                    )}
                  </CheckboxGroup>
                )}
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Отмена
          </Button>
          <Button
            colorScheme="#763186"
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DepartmentManageModal;
