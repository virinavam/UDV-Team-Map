import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import {
  SearchIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@chakra-ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import FilterDropdown from "../components/FilterDropdown";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import EmployeeEditModal from "../components/EmployeeEditModal";
import EmployeeDeleteModal from "../components/EmployeeDeleteModal";
import type { Employee } from "../types/types";
import { employeesAPI } from "../lib/api";
import { searchEmployees } from "../lib/search-utils";
import { ROUTES } from "../routes/paths";

type SortDirection = "asc" | "desc" | null;

const HRDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees", { scope: "hr" }],
    queryFn: () => employeesAPI.list(),
    retry: 1,
  });

  useEffect(() => {
    if (isError) {
      console.error("Ошибка загрузки кадровых данных:", error);
      toast({
        status: "error",
        title: "Не удалось загрузить данные",
        description:
          error instanceof Error
            ? error.message
            : "Проверьте подключение к серверу",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isError, error, toast]);

  const createOptions = (getter: (emp: Employee) => string | undefined) => {
    const items = new Set<string>();
    employees.forEach((emp) => {
      const value = getter(emp);
      if (value) items.add(value);
    });
    return Array.from(items).map((value) => ({ value, label: value }));
  };

  const legalEntities = useMemo(
    () =>
      createOptions(
        (emp) => emp.legalEntity || emp.departmentFull?.split(" / ")[0]
      ),
    [employees]
  );
  const departments = useMemo(
    () =>
      createOptions(
        (emp) => emp.departmentFull?.split(" / ")[2] || emp.department
      ),
    [employees]
  );
  const groups = useMemo(() => createOptions((emp) => emp.group), [employees]);
  const positions = useMemo(
    () => createOptions((emp) => emp.position),
    [employees]
  );
  const cities = useMemo(() => createOptions((emp) => emp.city), [employees]);

  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    // Универсальный поиск с fuzzy matching
    if (searchQuery.trim()) {
      filtered = searchEmployees(filtered, searchQuery, {
        fuzzyThreshold: 0.5,
        matchAllTokens: false,
      });
    }

    // Фильтр по юридическому лицу
    if (selectedLegalEntity.length) {
      filtered = filtered.filter((employee) => {
        const entity =
          employee.legalEntity || employee.departmentFull?.split(" / ")[0];
        return entity && selectedLegalEntity.includes(entity);
      });
    }

    // Фильтр по подразделению
    if (selectedDepartment.length) {
      filtered = filtered.filter((employee) => {
        const dep =
          employee.departmentFull?.split(" / ")[2] || employee.department;
        return dep && selectedDepartment.includes(dep);
      });
    }

    // Фильтр по группе
    if (selectedGroup.length) {
      filtered = filtered.filter(
        (employee) => employee.group && selectedGroup.includes(employee.group)
      );
    }

    // Фильтр по должности
    if (selectedPosition.length) {
      filtered = filtered.filter(
        (employee) =>
          employee.position && selectedPosition.includes(employee.position)
      );
    }

    // Фильтр по городу
    if (selectedCity.length) {
      filtered = filtered.filter(
        (employee) => employee.city && selectedCity.includes(employee.city)
      );
    }

    return filtered;
  }, [
    employees,
    searchQuery,
    selectedLegalEntity,
    selectedDepartment,
    selectedGroup,
    selectedPosition,
    selectedCity,
  ]);

  // Сортировка по ФИО
  const sortedEmployees = useMemo(() => {
    if (!sortDirection) {
      return filteredEmployees;
    }

    const sorted = [...filteredEmployees].sort((a, b) => {
      const fullNameA = `${a.lastName || ""} ${a.firstName || ""} ${a.middleName || ""}`.trim().toLowerCase();
      const fullNameB = `${b.lastName || ""} ${b.firstName || ""} ${b.middleName || ""}`.trim().toLowerCase();
      
      if (sortDirection === "asc") {
        return fullNameA.localeCompare(fullNameB, "ru");
      } else {
        return fullNameB.localeCompare(fullNameA, "ru");
      }
    });

    return sorted;
  }, [filteredEmployees, sortDirection]);

  const handleSortToggle = () => {
    if (sortDirection === null) {
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortDirection(null);
    }
  };

  const handleAddEmployee = () => {
    navigate(ROUTES.addEmployee);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    onEditModalOpen();
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    onDeleteModalOpen();
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    try {
      if (editingEmployee?.id) {
        await employeesAPI.update(editingEmployee.id, employeeData);
        toast({
          status: "success",
          title: "Данные сохранены",
          description: "Изменения успешно применены",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await employeesAPI.create(employeeData);
        toast({
          status: "success",
          title: "Сотрудник добавлен",
          description: "Новый сотрудник успешно добавлен",
          duration: 3000,
          isClosable: true,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onEditModalClose();
      setEditingEmployee(null);
    } catch (error) {
      toast({
        status: "error",
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await employeesAPI.remove(deletingEmployee.id);
      toast({
        status: "success",
        title: "Сотрудник удален",
        description: "Сотрудник успешно удален из системы",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onDeleteModalClose();
      setDeletingEmployee(null);
    } catch (error) {
      toast({
        status: "error",
        title: "Ошибка",
        description: "Не удалось удалить сотрудника",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const appliedFilters = useMemo(() => {
    const filters = [];
    if (searchQuery.trim()) {
      filters.push({
        id: "search",
        label: "Поиск",
        value: searchQuery.trim(),
        onRemove: () => setSearchQuery(""),
      });
    }
      filters.push(
      ...selectedLegalEntity.map((value) => ({
        id: `entity-${value}`,
        label: "Юридическое лицо",
        value,
        onRemove: () =>
          setSelectedLegalEntity((prev) =>
            prev.filter((item) => item !== value)
          ),
      })),
      ...selectedDepartment.map((value) => ({
        id: `dep-${value}`,
        label: "Подразделение",
        value,
        onRemove: () =>
          setSelectedDepartment((prev) =>
            prev.filter((item) => item !== value)
          ),
      })),
      ...selectedGroup.map((value) => ({
        id: `group-${value}`,
        label: "Группа",
        value,
        onRemove: () =>
          setSelectedGroup((prev) => prev.filter((item) => item !== value)),
      })),
      ...selectedPosition.map((value) => ({
        id: `pos-${value}`,
        label: "Должность",
        value,
        onRemove: () =>
          setSelectedPosition((prev) => prev.filter((item) => item !== value)),
      })),
      ...selectedCity.map((value) => ({
        id: `city-${value}`,
        label: "Город",
        value,
        onRemove: () =>
          setSelectedCity((prev) => prev.filter((item) => item !== value)),
      }))
    );
    return filters;
  }, [
    searchQuery,
    selectedLegalEntity,
    selectedDepartment,
    selectedGroup,
    selectedPosition,
    selectedCity,
  ]);

  const clearAllFilters =
    appliedFilters.length > 0
      ? () => {
          setSearchQuery("");
          setSelectedLegalEntity([]);
          setSelectedDepartment([]);
          setSelectedGroup([]);
          setSelectedPosition([]);
          setSelectedCity([]);
        }
      : undefined;

  return (
    <MainLayout>
      <Box p={6}>
        <VStack spacing={4} align="stretch">
          <HStack spacing={4}>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Поиск: фамилия, имя, должность, навыки (например: 'Иванов React Senior')"
                value={searchQuery}
                onChange={(e) => {
                  // Поиск работает мгновенно при вводе каждой буквы
                  setSearchQuery(e.target.value);
                }}
                bg="white"
                autoComplete="off"
              />
            </InputGroup>
            <Button
              colorScheme="purple"
              leftIcon={<AddIcon />}
              onClick={handleAddEmployee}
            >
              Добавить сотрудника
            </Button>
          </HStack>

          <AppliedFiltersBar
            filters={appliedFilters}
            onClear={clearAllFilters}
          />

          <HStack spacing={4} flexWrap="wrap">
            <FilterDropdown
              label="Юридическое лицо"
              options={legalEntities}
              selectedValues={selectedLegalEntity}
              onSelectionChange={setSelectedLegalEntity}
              showCount
            />
            <FilterDropdown
              label="Подразделение"
              options={departments}
              selectedValues={selectedDepartment}
              onSelectionChange={setSelectedDepartment}
              showCount
            />
            <FilterDropdown
              label="Группа"
              options={groups}
              selectedValues={selectedGroup}
              onSelectionChange={setSelectedGroup}
              showCount
            />
            <FilterDropdown
              label="Должность"
              options={positions}
              selectedValues={selectedPosition}
              onSelectionChange={setSelectedPosition}
              showCount
            />
            <FilterDropdown
              label="Город"
              options={cities}
              selectedValues={selectedCity}
              onSelectionChange={setSelectedCity}
              showCount
            />
          </HStack>

          <Box
            overflowX="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
          >
            <Table variant="simple" size="md" minW="800px">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Фото</Th>
                  <Th>
                    <HStack
                      spacing={1}
                      cursor="pointer"
                      onClick={handleSortToggle}
                      _hover={{ color: "purple.500" }}
                    >
                      <Text>ФИО</Text>
                      <VStack spacing={0} ml={1}>
                        <ArrowUpIcon
                          boxSize={2.5}
                          color={
                            sortDirection === "asc" ? "purple.500" : "gray.400"
                          }
                        />
                        <ArrowDownIcon
                          boxSize={2.5}
                          color={
                            sortDirection === "desc" ? "purple.500" : "gray.400"
                          }
                        />
                      </VStack>
                    </HStack>
                  </Th>
                  <Th>Должность</Th>
                  <Th>Юридическое лицо</Th>
                  <Th>Подразделение</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={6}>
                      <Text textAlign="center" py={6}>
                        Загрузка данных...
                      </Text>
                    </Td>
                  </Tr>
                ) : isError ? (
                  <Tr>
                    <Td colSpan={6}>
                      <Text textAlign="center" py={6} color="red.500">
                        Ошибка загрузки данных. Проверьте консоль для деталей.
                      </Text>
                    </Td>
                  </Tr>
                ) : filteredEmployees.length === 0 ? (
                  <Tr>
                    <Td colSpan={6}>
                      <Text textAlign="center" py={6} color="gray.500">
                        {employees.length === 0
                          ? "Нет данных для отображения"
                          : "Сотрудники не найдены по заданным фильтрам"}
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  sortedEmployees.map((employee) => (
                    <Tr key={employee.id} _hover={{ bg: "gray.50" }}>
                      <Td>
                        <Avatar
                          size="sm"
                          name={employee.name}
                          src={employee.photoUrl}
                        />
                      </Td>
                      <Td>
                        <Text fontWeight="medium">
                          {employee.lastName} {employee.firstName}{" "}
                          {employee.middleName}
                        </Text>
                      </Td>
                      <Td>{employee.position}</Td>
                      <Td>
                        {employee.legalEntity ||
                          employee.departmentFull?.split(" / ")[0] ||
                          "-"}
                      </Td>
                      <Td>
                        {employee.departmentFull?.split(" / ")[2] ||
                          employee.department ||
                          "-"}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Редактировать"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="purple"
                            variant="ghost"
                            onClick={() => handleEditEmployee(employee)}
                          />
                          <IconButton
                            aria-label="Удалить"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteEmployee(employee)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>

      {/* Модальное окно редактирования сотрудника */}
      <EmployeeEditModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
      />

      {/* Модальное окно удаления сотрудника */}
      <EmployeeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        employee={deletingEmployee}
        onConfirm={handleConfirmDelete}
      />
    </MainLayout>
  );
};

export default HRDataPage;
