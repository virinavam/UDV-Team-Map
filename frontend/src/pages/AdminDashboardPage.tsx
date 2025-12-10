import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
  useToast,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon } from "@chakra-ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import AdminEmployeeTable from "../components/AdminEmployeeTable";
import FilterDropdown from "../components/FilterDropdown";
import EmployeeEditModal from "../components/EmployeeEditModal";
import type { Employee } from "../types/types";
import { employeesAPI } from "../lib/api";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import { searchEmployees } from "../lib/search-utils";

const AdminDashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );

  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: employeesData = [], isLoading } = useQuery({
    queryKey: ["employees", { scope: "admin" }],
    queryFn: () => employeesAPI.list(),
  });

  useEffect(() => {
    setEmployees(employeesData);
  }, [employeesData]);

  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  // Получаем уникальные значения для фильтров
  const legalEntities = useMemo(() => {
    const entities = new Set<string>();
    employees.forEach((emp) => {
      const entity = emp.legalEntity || emp.departmentFull?.split(" / ")[0];
      if (entity) entities.add(entity);
    });
    return Array.from(entities).map((e) => ({ value: e, label: e }));
  }, [employees]);

  const departments = useMemo(() => {
    const deps = new Set<string>();
    employees.forEach((emp) => {
      const dep = emp.departmentFull?.split(" / ")[2] || emp.department;
      if (dep) deps.add(dep);
    });
    return Array.from(deps).map((d) => ({ value: d, label: d }));
  }, [employees]);

  const positions = useMemo(() => {
    const pos = new Set<string>();
    employees.forEach((emp) => {
      if (emp.position) pos.add(emp.position);
    });
    return Array.from(pos).map((p) => ({ value: p, label: p }));
  }, [employees]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    employees.forEach((emp) => {
      if (emp.city) citySet.add(emp.city);
    });
    return Array.from(citySet).map((c) => ({ value: c, label: c }));
  }, [employees]);

  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    employees.forEach((emp) => {
      if (emp.group) groupSet.add(emp.group);
    });
    return Array.from(groupSet).map((g) => ({ value: g, label: g }));
  }, [employees]);

  // Фильтрация сотрудников с новой логикой поиска
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
    if (selectedLegalEntity.length > 0) {
      filtered = filtered.filter((employee) => {
        const entity =
          employee.legalEntity || employee.departmentFull?.split(" / ")[0];
        return entity && selectedLegalEntity.includes(entity);
      });
    }

    // Фильтр по подразделению
    if (selectedDepartment.length > 0) {
      filtered = filtered.filter((employee) => {
        const dep =
          employee.departmentFull?.split(" / ")[2] || employee.department;
        return dep && selectedDepartment.includes(dep);
      });
    }

    // Фильтр по группе
    if (selectedGroup.length > 0) {
      filtered = filtered.filter(
        (employee) => employee.group && selectedGroup.includes(employee.group)
      );
    }

    // Фильтр по должности
    if (selectedPosition.length > 0) {
      filtered = filtered.filter(
        (employee) =>
          employee.position && selectedPosition.includes(employee.position)
      );
    }

    // Фильтр по городу
    if (selectedCity.length > 0) {
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

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    onEditModalOpen();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    onEditModalOpen();
  };

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee);
    onDeleteDialogOpen();
  };

  const confirmDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await employeesAPI.remove(deletingEmployee.id);
      setEmployees((prev) =>
        prev.filter((employee) => employee.id !== deletingEmployee.id)
      );
      toast({
        status: "success",
        title: "Сотрудник удален",
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (error) {
      toast({
        status: "error",
        title: "Не удалось удалить сотрудника",
      });
    } finally {
      onDeleteDialogClose();
      setDeletingEmployee(null);
    }
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    try {
      const updated = await employeesAPI.update(employeeData.id, employeeData);
      setEmployees((prev) => {
        const exists = prev.some((employee) => employee.id === updated.id);
        return exists
          ? prev.map((employee) =>
              employee.id === updated.id ? updated : employee
            )
          : [...prev, updated];
      });
      toast({ status: "success", title: "Данные сохранены" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onEditModalClose();
      setEditingEmployee(null);
    } catch (error) {
      toast({
        status: "error",
        title: "Не удалось сохранить изменения",
      });
    }
  };

  return (
    <MainLayout>
      <Box p={6}>
        <VStack spacing={4} align="stretch">
          {/* Поиск и кнопка добавления */}
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
              leftIcon={<AddIcon />}
              colorScheme="#763186"
              onClick={handleAddEmployee}
              isDisabled={isLoading}
            >
              Добавить нового сотрудника
            </Button>
          </HStack>

          <AppliedFiltersBar
            filters={[
              ...(searchQuery.trim()
                ? [
                    {
                      id: "search",
                      label: "Поиск",
                      value: searchQuery.trim(),
                      onRemove: () => setSearchQuery(""),
                    },
                  ]
                : []),
              ...selectedLegalEntity.map((entity) => ({
                id: `entity-${entity}`,
                label: "Юрлицо",
                value: entity,
                onRemove: () =>
                  setSelectedLegalEntity((prev) =>
                    prev.filter((item) => item !== entity)
                  ),
              })),
              ...selectedDepartment.map((dep) => ({
                id: `dep-${dep}`,
                label: "Подразделение",
                value: dep,
                onRemove: () =>
                  setSelectedDepartment((prev) =>
                    prev.filter((item) => item !== dep)
                  ),
              })),
              ...selectedGroup.map((group) => ({
                id: `group-${group}`,
                label: "Группа",
                value: group,
                onRemove: () =>
                  setSelectedGroup((prev) =>
                    prev.filter((item) => item !== group)
                  ),
              })),
              ...selectedPosition.map((pos) => ({
                id: `pos-${pos}`,
                label: "Должность",
                value: pos,
                onRemove: () =>
                  setSelectedPosition((prev) =>
                    prev.filter((item) => item !== pos)
                  ),
              })),
              ...selectedCity.map((city) => ({
                id: `city-${city}`,
                label: "Город",
                value: city,
                onRemove: () =>
                  setSelectedCity((prev) =>
                    prev.filter((item) => item !== city)
                  ),
              })),
            ]}
            onClear={
              searchQuery.trim() ||
              selectedLegalEntity.length ||
              selectedDepartment.length ||
              selectedGroup.length ||
              selectedPosition.length ||
              selectedCity.length
                ? () => {
                    setSearchQuery("");
                    setSelectedLegalEntity([]);
                    setSelectedDepartment([]);
                    setSelectedGroup([]);
                    setSelectedPosition([]);
                    setSelectedCity([]);
                  }
                : undefined
            }
          />

          {/* Фильтры */}
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

          {/* Таблица сотрудников */}
          <AdminEmployeeTable
            employees={filteredEmployees}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </VStack>
      </Box>

      {/* Модальное окно редактирования */}
      <EmployeeEditModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
      />

      {/* Диалог подтверждения удаления */}
      <Modal isOpen={isDeleteDialogOpen} onClose={onDeleteDialogClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Удалить сотрудника?</ModalHeader>
          <ModalBody>
            <Text>Вы уверены, что хотите удалить этого сотрудника?</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="#763186" mr={3} onClick={confirmDelete}>
              Да
            </Button>
            <Button variant="ghost" onClick={onDeleteDialogClose}>
              Нет
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

export default AdminDashboardPage;
