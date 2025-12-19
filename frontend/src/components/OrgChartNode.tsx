import { Box, Text, HStack, IconButton, VStack } from "@chakra-ui/react";
import AuthorizedAvatar from "./AuthorizedAvatar";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import type { OrgNode } from "../types/types";

interface OrgChartNodeProps {
  data: OrgNode & {
    managerName?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    employees?: Array<{
      id: string;
      name: string;
      photoUrl?: string;
    }>;
  };
}

export default function OrgChartNode({ data }: OrgChartNodeProps) {
  const hasChildren = data.children && data.children.length > 0;
  const hasEmployees = data.employees && data.employees.length > 0;
  const showExpandButton = hasChildren || hasEmployees;
  const managerName = data.managerName || "-";

  return (
    <Box
      position="relative"
      minW="240px"
      maxW="300px"
      bg="white"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="12px"
      p={4}
      boxShadow="none"
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      _hover={{
        borderColor: "gray.400",
      }}
      userSelect="none"
    >
      {/* Заголовок с кнопкой сворачивания */}
      <HStack justify="space-between" align="flex-start" mb={2} spacing={2}>
        <Text
          fontWeight="bold"
          fontSize="15px"
          color="gray.900"
          flex={1}
          lineHeight="1.4"
          noOfLines={2}
        >
          {data.name}
        </Text>
        {showExpandButton && (
          <IconButton
            aria-label={data.isExpanded ? "Свернуть" : "Развернуть"}
            icon={data.isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            color="gray.600"
            _hover={{
              bg: "gray.100",
              color: "#763186",
            }}
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleExpand?.();
            }}
            minW="24px"
            h="24px"
            flexShrink={0}
          />
        )}
      </HStack>

      {/* Руководитель */}
      <Text
        fontSize="13px"
        color="gray.600"
        lineHeight="1.5"
        mb={hasEmployees && data.isExpanded ? 3 : 0}
      >
        Руководитель: {managerName}
      </Text>

      {/* Список сотрудников (отображается когда узел развернут) */}
      {hasEmployees && data.isExpanded && (
        <VStack
          spacing={2}
          align="stretch"
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor="gray.200"
        >
          {data.employees!.map((employee) => (
            <HStack key={employee.id} spacing={3} align="center">
              <AuthorizedAvatar
                size="sm"
                name={employee.name}
                src={employee.photoUrl || "/placeholder.svg"}
                bg="gray.200"
              />
              <Text
                fontSize="14px"
                color="gray.900"
                fontWeight="medium"
                noOfLines={1}
              >
                {employee.name}
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
