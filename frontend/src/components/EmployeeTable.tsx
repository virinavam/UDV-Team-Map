import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Box } from "@chakra-ui/react";

// Типизация пропсов
interface Employee {
  id: string;
  name: string;
  position: string;
  city: string;
  email: string;
  skills: string[];
}

interface EmployeeTableProps {
  employees: Employee[];
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees }) => {
  return (
    <Box overflowX="auto" maxHeight="80vh">
      <Table variant="striped" colorScheme="blue" size="md">
        <Thead position="sticky" top={0} bg="gray.100" zIndex={1}>
          <Tr>
            <Th>Имя</Th>
            <Th>Должность</Th>
            <Th>Город</Th>
            <Th>Email</Th>
            <Th>Навыки</Th>
          </Tr>
        </Thead>
        <Tbody>
          {employees.map((e) => (
            <Tr key={e.id}>
              <Td>{e.name}</Td>
              <Td>{e.position}</Td>
              <Td>{e.city}</Td>
              <Td>{e.email}</Td>
              <Td>{e.skills.join(", ")}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default EmployeeTable;
