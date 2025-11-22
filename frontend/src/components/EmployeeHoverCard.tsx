import React from "react";
import { Box, Text } from "@chakra-ui/react";
import type { Employee } from "../types/types";

interface Props {
  employee: Employee;
}

const EmployeeHoverCard: React.FC<Props> = ({ employee }) => {
  return (
    <Box p={3} bg="white" shadow="md" borderRadius="md" w="200px">
      <Text fontWeight="bold">
        {employee.firstName} {employee.lastName}
      </Text>
      <Text fontSize="sm">{employee.position}</Text>
      <Text fontSize="sm">{employee.email}</Text>
    </Box>
  );
};

export default EmployeeHoverCard;
