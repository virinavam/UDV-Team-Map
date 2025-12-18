import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import { employeesAPI } from "../lib/api";
import { ROUTES } from "../routes/paths";

const AdminPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", { scope: "admin-panel" }],
    queryFn: () => employeesAPI.list(),
  });

  // Вычисляем метрики
  const metrics = useMemo(() => {
    const totalEmployees = employees.length;
    const departments = new Set(
      employees
        .map((emp) => emp.departmentFull?.split(" / ")[2] || emp.department)
        .filter(Boolean)
    ).size;
    const cities = new Set(employees.map((emp) => emp.city).filter(Boolean))
      .size;
    // Ожидает проверку - количество сотрудников без фото или с временным фото
    const awaitingVerification = employees.filter(
      (emp) => !emp.photoUrl || emp.photoUrl.includes("placeholder")
    ).length;

    return {
      totalEmployees,
      departments,
      cities,
      awaitingVerification,
    };
  }, [employees]);

  // Недавно добавленные сотрудники (последние 5, отсортированные по дате найма)
  const recentlyAdded = useMemo(() => {
    return [...employees]
      .sort((a, b) => {
        const dateA = a.hireDate
          ? new Date(a.hireDate.split(".").reverse().join("-"))
          : new Date(0);
        const dateB = b.hireDate
          ? new Date(b.hireDate.split(".").reverse().join("-"))
          : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [employees]);

  if (isLoading) {
    return (
      <MainLayout>
        <Box p={6}>Загрузка...</Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box p={6} bg="gray.50" minH="100vh">
        {/* Карточки с метриками */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
          <MetricCard
            title="Всего сотрудников"
            value={metrics.totalEmployees}
            description="Общее число сотрудников"
          />
          <MetricCard
            title="Подразделения"
            value={metrics.departments}
            description="Общее число подразделений"
          />
          <MetricCard
            title="Города"
            value={metrics.cities}
            description="Города, в которых находятся офисы"
          />
          <MetricCard
            title="Ожидает проверку"
            value={metrics.awaitingVerification}
            description="Количество фотографий, ожидающих проверку"
          />
        </SimpleGrid>

        {/* Кнопки действий и недавно добавленные сотрудники */}
        <HStack spacing={6} align="flex-start">
          {/* Кнопки действий */}
          <VStack spacing={4} align="stretch" flex={1} maxW="400px">
            <Button
              leftIcon={<AddIcon />}
              bg="#763186"
              color="white"
              _hover={{ bg: "#5e2770" }}
              size="lg"
              onClick={() => navigate(ROUTES.addEmployee)}
            >
              Добавить нового сотрудника
            </Button>
            <Button
              leftIcon={<Text fontSize="lg">📷</Text>}
              variant="outline"
              borderColor="#763186"
              color="#763186"
              _hover={{ bg: "purple.50", borderColor: "#5e2770" }}
              size="lg"
              onClick={() => navigate(ROUTES.moderation)}
            >
              Модерация фото
            </Button>
          </VStack>

          {/* Недавно добавленные сотрудники */}
          <Box
            bg="white"
            borderRadius="lg"
            p={6}
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            flex={1}
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Недавно добавленные сотрудники
            </Text>
            <VStack spacing={3} align="stretch">
              {recentlyAdded.length > 0 ? (
                recentlyAdded.map((employee) => (
                  <HStack
                    key={employee.id}
                    spacing={4}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: "gray.50" }}
                  >
                    <Avatar
                      size="md"
                      name={employee.name}
                      src={employee.photoUrl}
                    />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontWeight="medium">
                        {employee.lastName} {employee.firstName}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {employee.position}
                      </Text>
                    </VStack>
                    <Text fontSize="sm" color="gray.500">
                      {employee.hireDate || "—"}
                    </Text>
                  </HStack>
                ))
              ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                  Нет недавно добавленных сотрудников
                </Text>
              )}
            </VStack>
          </Box>
        </HStack>
      </Box>
    </MainLayout>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
}) => {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      p={6}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
    >
      <VStack align="start" spacing={2}>
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          {title}
        </Text>
        <Text fontSize="4xl" fontWeight="bold" color="#763186">
          {value}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {description}
        </Text>
      </VStack>
    </Box>
  );
};

export default AdminPanelPage;
