import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  VStack,
  HStack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  showCount?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  showCount = false,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tempSelection, setTempSelection] = useState<string[]>(selectedValues);

  useEffect(() => {
    setTempSelection(selectedValues);
  }, [selectedValues]);

  const handleApply = () => {
    onSelectionChange(tempSelection);
    onClose();
  };

  const handleReset = () => {
    setTempSelection([]);
    onSelectionChange([]);
    onClose();
  };

  const handleToggle = (value: string) => {
    if (tempSelection.includes(value)) {
      setTempSelection(tempSelection.filter((v) => v !== value));
    } else {
      setTempSelection([...tempSelection, value]);
    }
  };

  const count = selectedValues.length;
  const displayLabel = showCount && count > 0 ? `${label} ${count}` : label;

  return (
    <Menu isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="outline"
        size="md"
        bg="white"
        _hover={{ bg: "gray.50" }}
      >
        {displayLabel}
      </MenuButton>
      <MenuList minW="200px" p={4}>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Button
              size="sm"
              colorScheme="purple"
              onClick={handleApply}
            >
              Применить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              Сбросить
            </Button>
          </HStack>
          <Box maxH="300px" overflowY="auto">
            {options.map((option) => (
              <MenuItem key={option.value} onClick={() => handleToggle(option.value)}>
                <Checkbox
                  isChecked={tempSelection.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  mr={2}
                >
                  {option.label}
                </Checkbox>
              </MenuItem>
            ))}
          </Box>
        </VStack>
      </MenuList>
    </Menu>
  );
};

export default FilterDropdown;

