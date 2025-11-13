import React, { useState, useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import MainLayout from "../components/MainLayout";
import FilterDropdown from "../components/FilterDropdown";
import { mockEmployees } from "../lib/mock-data";
import type { Employee } from "../types/types";

const HRDataPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);

  // Получаем уникальные значения для фильтров
  const legalEntities = useMemo(() => {
    const entities = new Set<string>();
    mockEmployees.forEach((emp) => {
      const entity = emp.legalEntity || emp.departmentFull?.split(" / ")[0];
      if (entity) entities.add(entity);
    });
    return Array.from(entities).map((e) => ({ value: e, label: e }));
  }, []);

  const departments = useMemo(() => {
    const deps = new Set<string>();
    mockEmployees.forEach((emp) => {
      const dep = emp.departmentFull?.split(" / ")[2] || emp.department;
      if (dep) deps.add(dep);
    });
    return Array.from(deps).map((d) => ({ value: d, label: d }));
  }, []);

  const positions = useMemo(() => {
    const pos = new Set<string>();
    mockEmployees.forEach((emp) => {
      if (emp.position) pos.add(emp.position);
    });
    return Array.from(pos).map((p) => ({ value: p, label: p }));
  }, []);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    mockEmployees.forEach((emp) => {
      if (emp.city) citySet.add(emp.city);
    });
    return Array.from(citySet).map((c) => ({ value: c, label: c }));
  }, []);

  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    mockEmployees.forEach((emp) => {
      if (emp.group) groupSet.add(emp.group);
    });
    return Array.from(groupSet).map((g) => ({ value: g, label: g }));
  }, []);

  // Фильтрация сотрудников
  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((employee) => {
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
    searchQuery,
    selectedLegalEntity,
    selectedDepartment,
    selectedGroup,
    selectedPosition,
    selectedCity,
  ]);

  const handleExportToExcel = () => {
    // Имитация экспорта в Excel
    const csvContent = [
      ["ФИО", "Должность", "Дата найма", "Оклад", "Статус", "Номер договора", "Юридическое лицо", "Подразделение"],
      ...filteredEmployees.map((emp) => [
        `${emp.lastName} ${emp.firstName} ${emp.middleName}`,
        emp.position || "",
        emp.hireDate || "",
        emp.salary?.toString() || "",
        emp.employmentStatus || "",
        emp.contractNumber || "",
        emp.legalEntity || "",
        emp.department || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "hr_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <Box p={6}>
        <VStack spacing={4} align="stretch">
          {/* Поиск и кнопка экспорта */}
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
              colorScheme="purple"
              onClick={handleExportToExcel}
            >
              📥 Экспорт в Excel
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

          {/* Таблица сотрудников с расширенными колонками */}
          <Box
            overflowX="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
          >
            <Table variant="simple" size="md" minW="1200px">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Фото</Th>
                  <Th>
                    <HStack spacing={1}>
                      <Text>ФИО</Text>
                      <Text fontSize="xs">↕</Text>
                    </HStack>
                  </Th>
                  <Th>Должность</Th>
                  <Th>Дата найма</Th>
                  <Th>Оклад</Th>
                  <Th>Статус трудоустройства</Th>
                  <Th>Номер трудового договора</Th>
                  <Th>Юридическое лицо</Th>
                  <Th>Подразделение</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEmployees.map((employee) => (
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
                        {employee.lastName} {employee.firstName} {employee.middleName}
                      </Text>
                    </Td>
                    <Td>{employee.position}</Td>
                    <Td>{employee.hireDate || "-"}</Td>
                    <Td>{employee.salary ? `${employee.salary.toLocaleString()} ₽` : "-"}</Td>
                    <Td>{employee.employmentStatus || "Работает"}</Td>
                    <Td>{employee.contractNumber || "-"}</Td>
                    <Td>{employee.legalEntity || employee.departmentFull?.split(" / ")[0] || "-"}</Td>
                    <Td>{employee.departmentFull?.split(" / ")[2] || employee.department || "-"}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Редактировать"
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="purple"
                          variant="ghost"
                        />
                        <IconButton
                          aria-label="Удалить"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>
    </MainLayout>
  );
};

export default HRDataPage;

