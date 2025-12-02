import React, { useEffect, useMemo, useState } from "react";
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
} from "@chakra-ui/react";
import { SearchIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import FilterDropdown from "../components/FilterDropdown";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import type { Employee } from "../types/types";
import { employeesAPI } from "../lib/api";

const HRDataPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const toast = useToast();

  const { data: employeesData = [], isLoading, isError } = useQuery({
    queryKey: ["employees", { scope: "hr" }],
    queryFn: () => employeesAPI.list(),
  });

  useEffect(() => {
    setEmployees(employeesData);
  }, [employeesData]);

  useEffect(() => {
    if (isError) {
      toast({
        status: "error",
        title: "Не удалось загрузить данные",
      });
    }
  }, [isError, toast]);

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
  const groups = useMemo(
    () => createOptions((emp) => emp.group),
    [employees]
  );
  const positions = useMemo(
    () => createOptions((emp) => emp.position),
    [employees]
  );
  const cities = useMemo(
    () => createOptions((emp) => emp.city),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableText = `${employee.lastName} ${employee.firstName} ${employee.middleName} ${employee.position} ${employee.email}`.toLowerCase();
        const matches = query
          .split(" ")
          .filter(Boolean)
          .every((word) => searchableText.includes(word));
        if (!matches) return false;
      }

      if (selectedLegalEntity.length) {
        const entity =
          employee.legalEntity || employee.departmentFull?.split(" / ")[0];
        if (!entity || !selectedLegalEntity.includes(entity)) return false;
      }

      if (selectedDepartment.length) {
        const dep =
          employee.departmentFull?.split(" / ")[2] || employee.department;
        if (!dep || !selectedDepartment.includes(dep)) return false;
      }

      if (selectedGroup.length) {
        if (!employee.group || !selectedGroup.includes(employee.group))
          return false;
      }

      if (selectedPosition.length) {
        if (!employee.position || !selectedPosition.includes(employee.position))
          return false;
      }

      if (selectedCity.length) {
        if (!employee.city || !selectedCity.includes(employee.city))
          return false;
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

  const handleExportToExcel = () => {
    const csvContent = [
      [
        "ФИО",
        "Должность",
        "Дата найма",
        "Оклад",
        "Статус",
        "Номер договора",
        "Юридическое лицо",
        "Подразделение",
      ],
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
    link.href = url;
    link.download = "hr_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const appliedFilters = [
    ...selectedLegalEntity.map((value) => ({
      id: `entity-${value}`,
      label: "Юрлицо",
      value,
      onRemove: () =>
        setSelectedLegalEntity((prev) => prev.filter((item) => item !== value)),
    })),
    ...selectedDepartment.map((value) => ({
      id: `dep-${value}`,
      label: "Подразделение",
      value,
      onRemove: () =>
        setSelectedDepartment((prev) => prev.filter((item) => item !== value)),
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
    })),
  ];

  const clearAllFilters =
    appliedFilters.length > 0
      ? () => {
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
                placeholder="Поиск сотрудников..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
              />
            </InputGroup>
            <Button colorScheme="purple" onClick={handleExportToExcel}>
              📥 Экспорт в Excel
            </Button>
          </HStack>

          <AppliedFiltersBar filters={appliedFilters} onClear={clearAllFilters} />

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
            <Table variant="simple" size="md" minW="1200px">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Фото</Th>
                  <Th>ФИО</Th>
                  <Th>Должность</Th>
                  <Th>Дата найма</Th>
                  <Th>Оклад</Th>
                  <Th>Статус</Th>
                  <Th>Номер договора</Th>
                  <Th>Юрлицо</Th>
                  <Th>Подразделение</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={10}>
                      <Text textAlign="center" py={6}>
                        Загрузка данных...
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredEmployees.map((employee) => (
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
                      <Td>{employee.hireDate || "-"}</Td>
                      <Td>
                        {employee.salary
                          ? `${employee.salary.toLocaleString()} ₽`
                          : "-"}
                      </Td>
                      <Td>{employee.employmentStatus || "Работает"}</Td>
                      <Td>{employee.contractNumber || "-"}</Td>
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
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>
    </MainLayout>
  );
};

export default HRDataPage;
