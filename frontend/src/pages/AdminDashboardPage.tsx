import React, { useState, useMemo } from "react";
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
} from "@chakra-ui/react";
import { SearchIcon, AddIcon } from "@chakra-ui/icons";
import MainLayout from "../components/MainLayout";
import AdminEmployeeTable from "../components/AdminEmployeeTable";
import FilterDropdown from "../components/FilterDropdown";
import EmployeeEditModal from "../components/EmployeeEditModal";
import { mockEmployees } from "../lib/mock-data";
import type { Employee } from "../types/types";

const AdminDashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

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

  // Фильтрация сотрудников
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Поиск
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${employee.lastName} ${employee.firstName} ${employee.middleName} ${employee.position} ${employee.email}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Фильтр по юридическому лицу
      if (selectedLegalEntity.length > 0) {
        const entity = employee.legalEntity || employee.departmentFull?.split(" / ")[0];
        if (!entity || !selectedLegalEntity.includes(entity)) {
          return false;
        }
      }

      // Фильтр по подразделению
      if (selectedDepartment.length > 0) {
        const dep = employee.departmentFull?.split(" / ")[2] || employee.department;
        if (!dep || !selectedDepartment.includes(dep)) {
          return false;
        }
      }

      // Фильтр по группе
      if (selectedGroup.length > 0) {
        if (!employee.group || !selectedGroup.includes(employee.group)) {
          return false;
        }
      }

      // Фильтр по должности
      if (selectedPosition.length > 0) {
        if (!employee.position || !selectedPosition.includes(employee.position)) {
          return false;
        }
      }

      // Фильтр по городу
      if (selectedCity.length > 0) {
        if (!employee.city || !selectedCity.includes(employee.city)) {
          return false;
        }
      }

      return true;
    });
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

  const confirmDelete = () => {
    if (deletingEmployee) {
      setEmployees(employees.filter((e) => e.id !== deletingEmployee.id));
      onDeleteDialogClose();
      setDeletingEmployee(null);
    }
  };

  const handleSaveEmployee = (employeeData: Employee) => {
    if (editingEmployee) {
      // Обновление существующего сотрудника
      setEmployees(
        employees.map((e) => (e.id === editingEmployee.id ? employeeData : e))
      );
    } else {
      // Добавление нового сотрудника
      const newEmployee = {
        ...employeeData,
        id: `e${Date.now()}`,
      };
      setEmployees([...employees, newEmployee]);
    }
    onEditModalClose();
    setEditingEmployee(null);
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
                placeholder="Поиск сотрудников..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
              />
            </InputGroup>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="purple"
              onClick={handleAddEmployee}
            >
              Добавить нового сотрудника
            </Button>
          </HStack>

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
            <Button colorScheme="purple" mr={3} onClick={confirmDelete}>
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

