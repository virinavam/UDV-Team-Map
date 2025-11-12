import { Box, Text, Badge } from "@chakra-ui/react";
import type { OrgNode } from "../types/types";

interface OrgChartNodeProps {
  data: OrgNode;
}

export default function OrgChartNode({ data }: OrgChartNodeProps) {
  return (
    <Box position="relative" minW="200px" minH="84px">
      {/* Фон квадратика из макета */}
      <Box
        position="absolute"
        left="-20px"
        right="-20px"
        top="0"
        bottom="0"
        bg="#F6F6F6"
        borderRadius="16px"
        zIndex={0}
      />

      {/* Контент карточки */}
      <Box position="relative" zIndex={1} p={3}>
        <Text fontWeight="bold" fontSize="17px">
          {data.name}
        </Text>
        {data.type === "employee" && (
          <Badge mt={2} colorScheme="blue">
            Employee
          </Badge>
        )}
      </Box>
    </Box>
  );
}
