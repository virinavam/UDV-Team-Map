import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import AuthorizedAvatar from "../components/AuthorizedAvatar";
import FilterDropdown from "../components/FilterDropdown";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import EmployeeEditModal from "../components/EmployeeEditModal";
import EmployeeDeleteModal from "../components/EmployeeDeleteModal";
import type { Employee } from "../types/types";
import { employeesAPI, skillsAPI, legalEntitiesAPI, departmentsAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes/paths";
import { useDebounce } from "../hooks/useDebounce";

type SortDirection = "asc" | "desc" | null;

const HRDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN";
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );
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

  // Определяем, нужно ли использовать серверный поиск (используем debounced значение)
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const hasServerFilters = selectedCity.length > 0;

  // Загружаем данные: либо через поиск API, либо через обычный list
  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "employees",
      {
        scope: "hr",
        search: hasSearchQuery ? debouncedSearchQuery.trim() : undefined,
        cities: selectedCity.length > 0 ? selectedCity : undefined,
      },
    ],
    queryFn: () => {
      if (hasSearchQuery) {
        // Используем серверный поиск
        return employeesAPI.search({
          q: debouncedSearchQuery.trim(),
          cities: selectedCity.length > 0 ? selectedCity : undefined,
        });
      } else if (hasServerFilters) {
        // Используем list с фильтрами
        return employeesAPI.list({
          city: selectedCity[0], // list принимает один city, берем первый
        });
      } else {
        // Обычный список всех сотрудников
        return employeesAPI.list();
      }
    },
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

  // Получаем списки юридических лиц и отделов с сервера для заполнения фильтров
  const { data: legalEntitiesFromApi = [] } = useQuery({
    queryKey: ["legal-entities"],
    queryFn: () => legalEntitiesAPI.list(),
    retry: 1,
  });

  const { data: departmentsFromApi = [] } = useQuery({
    queryKey: ["departments-list"],
    queryFn: () => departmentsAPI.list(),
    retry: 1,
  });

  const createOptions = (getter: (emp: Employee) => string | undefined) => {
    const items = new Set<string>();
    employees.forEach((emp) => {
      const value = getter(emp);
      if (value) items.add(value);
    });
    return Array.from(items).map((value) => ({ value, label: value }));
  };

  const legalEntities = useMemo(() => {
    // Сначала используем данные из API
    if (legalEntitiesFromApi && legalEntitiesFromApi.length > 0) {
      return legalEntitiesFromApi.map((le: any) => ({ value: le.name, label: le.name }));
    }
    // Fallback на вычисление из сотрудников
    return createOptions(
      (emp) => emp.legalEntity || emp.departmentFull?.split(" / ")[0]
    );
  }, [legalEntitiesFromApi, employees]);

  const departments = useMemo(() => {
    // Сначала используем данные из API
    if (departmentsFromApi && departmentsFromApi.length > 0) {
      // Берём полный путь подразделения
      return departmentsFromApi
        .map((d: any) => {
          // Построим полный путь подразделения через parent_id
          const buildPath = (dept: any, allDepts: any[], seen = new Set<string>()): string[] => {
            if (!dept || seen.has(dept.id)) return [];
            seen.add(dept.id);
            const parts = [dept.name];
            if (dept.parent_id) {
              const parent = allDepts.find((p: any) => p.id === dept.parent_id);
              if (parent) {
                const parentParts = buildPath(parent, allDepts, seen);
                return [...parentParts, ...parts];
              }
            }
            return parts;
          };
          const path = buildPath(d, departmentsFromApi).join(" / ");
          return { value: path, label: path };
        })
        // Удаляем дубликаты по value
        .filter((v: any, i: number, arr: any[]) => arr.findIndex((a: any) => a.value === v.value) === i);
    }
    // Fallback на вычисление из сотрудников
    return createOptions(
      (emp) => emp.departmentFull?.split(" / ")[2] || emp.department
    );
  }, [departmentsFromApi, employees]);
  const positions = useMemo(
    () => createOptions((emp) => emp.position),
    [employees]
  );
  const cities = useMemo(() => createOptions((emp) => emp.city), [employees]);

  // Построим мапы для быстрого поиска отдела и юридического лица по id
  const departmentsMap = useMemo(() => {
    const map = new Map<string, any>();
    if (departmentsFromApi && departmentsFromApi.length > 0) {
      departmentsFromApi.forEach((d: any) => map.set(d.id, d));
    }
    return map;
  }, [departmentsFromApi]);

  const legalEntitiesMap = useMemo(() => {
    const map = new Map<string, any>();
    if (legalEntitiesFromApi && legalEntitiesFromApi.length > 0) {
      legalEntitiesFromApi.forEach((le: any) => map.set(le.id, le));
    }
    return map;
  }, [legalEntitiesFromApi]);

  // Функция для построения полного пути подразделения через parent_id
  const buildDepartmentPath = (deptId?: string) => {
    if (!deptId) return null;
    const parts: string[] = [];
    let current = departmentsMap.get(deptId);
    // Проходим вверх по parent_id и собираем имена
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      parts.unshift(current.name);
      if (!current.parent_id) break;
      current = departmentsMap.get(current.parent_id);
    }
    return parts.length ? parts.join(" / ") : null;
  };

  // Клиентская фильтрация только для фильтров, которые не поддерживаются API поиском
  // (юридическое лицо, подразделение, должность)
  // Поиск и фильтр по городу теперь выполняются на сервере
  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    // Фильтр по юридическому лицу
    if (selectedLegalEntity.length) {
      filtered = filtered.filter((employee) => {
        // Получаем юридическое лицо для этого сотрудника
        let entityName: string | null = null;
        if (employee.legalEntity) {
          entityName = employee.legalEntity;
        } else if (employee.departmentId) {
          const dept = departmentsMap.get(employee.departmentId);
          if (dept && dept.legal_entity_id) {
            const le = legalEntitiesMap.get(dept.legal_entity_id);
            if (le) {
              entityName = le.name;
            }
          }
        }
        if (!entityName) {
          entityName = employee.departmentFull?.split(" / ")[0];
        }
        return entityName && selectedLegalEntity.includes(entityName);
      });
    }

    // Фильтр по подразделению
    if (selectedDepartment.length) {
      filtered = filtered.filter((employee) => {
        let deptPath: string | null = null;
        if (employee.departmentId) {
          deptPath = buildDepartmentPath(employee.departmentId);
        }
        if (!deptPath) {
          deptPath = employee.departmentFull?.split(" / ").slice(1).join(" / ") || employee.department;
        }
        return deptPath && selectedDepartment.includes(deptPath);
      });
    }

    // Фильтр по должности
    if (selectedPosition.length) {
      filtered = filtered.filter(
        (employee) =>
          employee.position && selectedPosition.includes(employee.position)
      );
    }

    return filtered;
  }, [employees, selectedLegalEntity, selectedDepartment, selectedPosition, departmentsMap, legalEntitiesMap]);

  // Сортировка по ФИО
  const sortedEmployees = useMemo(() => {
    if (!sortDirection) {
      return filteredEmployees;
    }

    const sorted = [...filteredEmployees].sort((a, b) => {
      const fullNameA = `${a.lastName || ""} ${a.firstName || ""}`
        .trim()
        .toLowerCase();
      const fullNameB = `${b.lastName || ""} ${b.firstName || ""}`
        .trim()
        .toLowerCase();

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
        // Обновляем данные сотрудника (навыки обрабатываются в EmployeeEditModal через set_skills)
        const { skills, ...dataWithoutSkills } = employeeData;
        const updated = await employeesAPI.update(
          editingEmployee.id,
          dataWithoutSkills
        );
        // Обновляем editingEmployee с новыми данными, включая photoUrl
        if (updated) {
          setEditingEmployee(updated);
        }
        // Для HR/админов не показываем сообщение здесь, так как навыки устанавливаются после
        // и там будет показано отдельное сообщение
        if (
          !isAdmin ||
          !employeeData.skills ||
          employeeData.skills.length === 0
        ) {
          toast({
            status: "success",
            title: "Данные сохранены",
            description: "Изменения успешно применены",
            duration: 3000,
            isClosable: true,
          });
        }
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
      // Инвалидируем кеш сотрудников, чтобы обновить список с новыми навыками
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      // Также инвалидируем кеш конкретного сотрудника, если он редактировался
      if (editingEmployee?.id) {
        queryClient.invalidateQueries({
          queryKey: ["employee", editingEmployee.id],
        });
      }
      onEditModalClose();
      setEditingEmployee(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла ошибка при сохранении";
      toast({
        status: "error",
        title: "Ошибка",
        description: errorMessage || "Не удалось сохранить изменения",
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
    selectedPosition,
    selectedCity,
  ]);

  const clearAllFilters =
    appliedFilters.length > 0
      ? () => {
          setSearchQuery("");
          setSelectedLegalEntity([]);
          setSelectedDepartment([]);
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
                placeholder="Поиск: фамилия, имя, должность, навыки"
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
              bg="#763186"
              color="white"
              _hover={{ bg: "#5e2770" }}
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
                        <AuthorizedAvatar
                          size="sm"
                          name={employee.name}
                          src={employee.photoUrl}
                        />
                      </Td>
                      <Td>
                        <Text fontWeight="medium">
                          {employee.lastName} {employee.firstName}
                        </Text>
                      </Td>
                      <Td>{employee.position}</Td>
                      <Td>
                        <Text noOfLines={1} maxW="150px">
                          {(() => {
                            // Сначала используем explicit поле employee.legalEntity
                            if (employee.legalEntity) return employee.legalEntity;
                            // Если есть departmentId, попробуем по нему найти юридическое лицо
                            if (employee.departmentId) {
                              const dept = departmentsMap.get(employee.departmentId);
                              if (dept && dept.legal_entity_id) {
                                const le = legalEntitiesMap.get(dept.legal_entity_id);
                                if (le) return le.name;
                              }
                            }
                            // Фоллбек на departmentFull парсинг
                            return (
                              employee.departmentFull?.split(" / ")[0] || "-"
                            );
                          })()}
                        </Text>
                      </Td>
                      <Td>
                        {(() => {
                          // Попробуем построить путь подразделения через departmentId
                          if (employee.departmentId) {
                            const path = buildDepartmentPath(employee.departmentId);
                            if (path) return path;
                          }
                          // Фоллбек: возьмём вторую/третью часть departmentFull если есть
                          const parts = employee.departmentFull?.split(" / ") || [];
                          return parts.slice(1).join(" / ") || employee.department || "-";
                        })()}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Редактировать"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="#763186"
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
