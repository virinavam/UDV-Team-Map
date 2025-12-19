import React from "react";
import {
  Box,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Button,
  Text,
} from "@chakra-ui/react";

export interface AppliedFilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface AppliedFiltersBarProps {
  filters: AppliedFilterChip[];
  onClear?: () => void;
}

const AppliedFiltersBar: React.FC<AppliedFiltersBarProps> = ({
  filters,
  onClear,
}) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <Box mt={4} mb={4}>
      <HStack spacing={3} flexWrap="wrap" align="center">
        <Text fontSize="sm" color="gray.600" fontWeight="medium" mr={2}>
          Примененные фильтры:
        </Text>
        {filters.map((filter) => (
          <Tag
            key={`${filter.id}-${filter.value}`}
            size="md"
            variant="solid"
            colorScheme="#763186"
            borderRadius="full"
            px={3}
            py={1}
          >
            <TagLabel fontSize="sm">
              {filter.label}: <strong>{filter.value}</strong>
            </TagLabel>
            <TagCloseButton onClick={filter.onRemove} />
          </Tag>
        ))}
        {onClear && (
          <Button
            size="sm"
            variant="ghost"
            colorScheme="#763186"
            onClick={onClear}
            ml={2}
          >
            Сбросить все
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default AppliedFiltersBar;
