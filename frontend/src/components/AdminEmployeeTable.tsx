import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Avatar,
  HStack,
  Text,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import type { Employee } from "../types/types";

interface AdminEmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isLoading?: boolean;
}

const AdminEmployeeTable: React.FC<AdminEmployeeTableProps> = ({
  employees,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  return (
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
              <HStack spacing={1}>
                <Text>ФИО</Text>
                <Text fontSize="xs">↕</Text>
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
                <Text textAlign="center" py={4}>
                  Загрузка сотрудников...
                </Text>
              </Td>
            </Tr>
          ) : (
            employees.map((employee) => (
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
                      colorScheme="#763186"
                      variant="ghost"
                      onClick={() => onEdit(employee)}
                    />
                    <IconButton
                      aria-label="Удалить"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => onDelete(employee)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default AdminEmployeeTable;
