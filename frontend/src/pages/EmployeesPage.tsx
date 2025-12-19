import React, { useMemo, useState } from "react";
import { Box, SimpleGrid, Spinner, Center, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import SearchAndFilters from "../components/SearchAndFilters";
import EmployeeCard from "../components/EmployeeCard";
import { employeesAPI, filtersAPI } from "../lib/api";
import AppliedFiltersBar from "../components/AppliedFiltersBar";
import { useDebounce } from "../hooks/useDebounce";

const EmployeesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const {
    data: filtersData,
    isLoading: isLoadingFilters,
    isError: isFiltersError,
    error: filtersError,
  } = useQuery({
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

  // Определяем, нужно ли использовать серверный поиск (используем debounced значение)
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const hasServerFilters = selectedCity || selectedSkills.length > 0;

  // Загружаем данные: либо через поиск API, либо через обычный list
  const {
    data: employees = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "employees",
      {
        scope: hasSearchQuery
          ? "search"
          : hasServerFilters
          ? "filtered"
          : "all",
        search: hasSearchQuery ? debouncedSearchQuery.trim() : undefined,
        city: selectedCity || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      },
    ],
    queryFn: () => {
      if (hasSearchQuery) {
        // Используем серверный поиск
        return employeesAPI.search({
          q: debouncedSearchQuery.trim(),
          cities: selectedCity ? [selectedCity] : undefined,
          skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        });
      } else if (hasServerFilters) {
        // Используем list с фильтрами
        return employeesAPI.list({
          city: selectedCity || undefined,
          skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        });
      } else {
        // Обычный список всех сотрудников
        return employeesAPI.list();
      }
    },
    enabled: true, // Всегда включен
  });

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

  return (
    <MainLayout>
      <Box p={6}>
        {isFiltersError && (
          <Box
            mb={4}
            p={3}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
          >
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
          {isLoading && !isFiltersError ? (
            <Center py={12}>
              <Spinner size="lg" color="purple.500" />
            </Center>
          ) : isError ? (
            <Center py={12}>
              <Text color="red.500">Не удалось загрузить сотрудников</Text>
            </Center>
          ) : (
            <>
              <SimpleGrid
                columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
                spacing={6}
              >
                {employees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </SimpleGrid>
              {employees.length === 0 && !isLoading && (
                <Box textAlign="center" py={8}>
                  Сотрудники не найдены
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default EmployeesPage;
