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

  const { data: filtersData, isLoading: isLoadingFilters, isError: isFiltersError, error: filtersError } = useQuery({
    queryKey: ["filter-options"],
    queryFn: () => filtersAPI.getOptions(),
    retry: 2,
  });

  // Логирование для отладки
  React.useEffect(() => {
    if (filtersData) {
      console.log("[EmployeesPage] Filters data loaded:", filtersData);
      console.log("[EmployeesPage] Cities:", filtersData.cities?.length || 0);
      console.log("[EmployeesPage] Skills:", filtersData.skills?.length || 0);
    }
    if (isFiltersError) {
      console.error("[EmployeesPage] Error loading filters:", filtersError);
    }
  }, [filtersData, isFiltersError, filtersError]);

  // Двухуровневая фильтрация:
  // 1. Серверная фильтрация - для фильтров по городу и навыкам (работает с БД, логика AND для навыков)
  // 2. Клиентская фильтрация - для поиска с fuzzy matching (быстрый отклик)
  
  // Определяем, нужно ли использовать серверную фильтрацию
  // Серверная фильтрация используется, если есть фильтры по городу или навыкам
  const hasServerFilters = selectedCity || selectedSkills.length > 0;
  
  // Загружаем данные: либо всех сотрудников (для клиентской фильтрации),
  // либо с серверными фильтрами (город, навыки с логикой AND)
  const {
    data: allEmployees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "employees",
      {
        scope: hasServerFilters ? "filtered" : "all",
        city: selectedCity || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      },
    ],
    queryFn: () =>
      employeesAPI.list({
        // На сервере передаем только фильтры (город, навыки с логикой AND)
        // Поиск делаем на клиенте для быстрого отклика
        city: selectedCity || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      }),
    enabled: true, // Всегда включен
  });

  // Клиентская фильтрация: применяем поиск с fuzzy matching
  // Фильтрация по навыкам на клиенте (когда нет серверных фильтров) использует логику OR
  const employees = useMemo(() => {
    let filtered = [...allEmployees];

    // Поиск с fuzzy matching (клиентская фильтрация)
    // Ищет по ФИО, должности, email и навыкам
    if (searchQuery.trim()) {
      filtered = searchEmployees(filtered, searchQuery, {
        fuzzyThreshold: 0.5,
        matchAllTokens: false,
      });
    }

    return filtered;
  }, [allEmployees, searchQuery]);

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
        {isFiltersError && (
          <Box mb={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
            <Text color="red.600" fontSize="sm">
              Ошибка загрузки фильтров. Проверьте подключение к серверу.
            </Text>
          </Box>
        )}
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
