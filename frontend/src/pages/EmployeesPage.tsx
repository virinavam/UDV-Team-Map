import React, { useMemo, useState } from "react";
import { Box, SimpleGrid, Spinner, Center, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import SearchAndFilters from "../components/SearchAndFilters";
import EmployeeCard from "../components/EmployeeCard";
import { employeesAPI, filtersAPI } from "../lib/api";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import { searchEmployees } from "../lib/search-utils";

const EmployeesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: filtersData } = useQuery({
    queryKey: ["filter-options"],
    queryFn: () => filtersAPI.getOptions(),
  });

  const {
    data: allEmployees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["employees", { scope: "list" }],
    queryFn: () => employeesAPI.list(),
  });

  // Применяем клиентскую фильтрацию с новой логикой поиска
  const employees = useMemo(() => {
    let filtered = [...allEmployees];

    // Универсальный поиск с fuzzy matching
    if (searchQuery.trim()) {
      filtered = searchEmployees(filtered, searchQuery, {
        fuzzyThreshold: 0.5,
        matchAllTokens: false,
      });
    }

    // Фильтр по городу
    if (selectedCity) {
      filtered = filtered.filter((emp) => emp.city === selectedCity);
    }

    // Фильтр по навыкам
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((emp) =>
        selectedSkills.some((skill) => emp.skills?.includes(skill))
      );
    }

    return filtered;
  }, [allEmployees, searchQuery, selectedCity, selectedSkills]);

  const appliedFilters = useMemo(() => {
    const chips = [];
    if (selectedCity) {
      chips.push({
        id: "city",
        label: "Город",
        value: selectedCity,
        onRemove: () => setSelectedCity(""),
      });
    }
    selectedSkills.forEach((skill) =>
      chips.push({
        id: `skill-${skill}`,
        label: "Навык",
        value: skill,
        onRemove: () =>
          setSelectedSkills((prev) => prev.filter((item) => item !== skill)),
      })
    );
    if (searchQuery.trim()) {
      chips.push({
        id: "search",
        label: "Поиск",
        value: searchQuery.trim(),
        onRemove: () => setSearchQuery(""),
      });
    }
    return chips;
  }, [selectedCity, selectedSkills, searchQuery]);

  const handleClearFilters = () => {
    setSelectedCity("");
    setSelectedSkills([]);
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Center h="70vh">
          <Spinner size="lg" color="purple.500" />
        </Center>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <Center h="70vh">
          <Text color="red.500">Не удалось загрузить сотрудников</Text>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box p={6}>
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedSkills={selectedSkills}
          onSkillsChange={setSelectedSkills}
          cities={filtersData?.cities || []}
          skills={filtersData?.skills || []}
        />
        <AppliedFiltersBar
          filters={appliedFilters}
          onClear={appliedFilters.length ? handleClearFilters : undefined}
        />
        <Box mt={6}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </SimpleGrid>
          {employees.length === 0 && (
            <Box textAlign="center" py={8}>
              Сотрудники не найдены
            </Box>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default EmployeesPage;
