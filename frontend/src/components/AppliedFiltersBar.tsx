import React from "react";
import { HStack, Tag, TagLabel, TagCloseButton, Button } from "@chakra-ui/react";

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
    <HStack spacing={3} flexWrap="wrap" mt={4}>
      {filters.map((filter) => (
        <Tag
          key={`${filter.id}-${filter.value}`}
          size="lg"
          variant="solid"
          colorScheme="purple"
        >
          <TagLabel>
            {filter.label}: {filter.value}
          </TagLabel>
          <TagCloseButton onClick={filter.onRemove} />
        </Tag>
      ))}
      {onClear && (
        <Button size="sm" variant="ghost" onClick={onClear}>
          Сбросить все
        </Button>
      )}
    </HStack>
  );
};

export default AppliedFiltersBar;



