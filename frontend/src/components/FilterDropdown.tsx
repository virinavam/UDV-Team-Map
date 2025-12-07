import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  Checkbox,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Синхронизация временного выбора с внешними selectedValues
  useEffect(() => {
    setTempSelection(selectedValues);
  }, [selectedValues]);

  // Сброс поиска при закрытии меню
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Переключение выбора
  const handleToggle = (value: string) => {
    setTempSelection((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Применить выбранные значения
  const handleApply = () => {
    onSelectionChange(tempSelection);
    onClose();
  };

  // Сбросить выбор
  const handleReset = () => {
    setTempSelection([]);
    onSelectionChange([]);
    onClose();
  };

  // Фильтрация опций по поисковому запросу
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Отображение количества выбранных опций
  const count = selectedValues.length;
  const displayLabel = showCount && count > 0 ? `${label} (${count})` : label;

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
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
              autoComplete="off"
            />
          </InputGroup>

          <HStack justify="space-between">
            <Button
              size="sm"
              bg="#763186"
              color="white"
              _hover={{ bg: "#5e2770" }}
              onClick={handleApply}
            >
              Применить
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Сбросить
            </Button>
          </HStack>

          <Box maxH="300px" overflowY="auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Box
                  key={option.value}
                  p={2}
                  _hover={{ bg: "gray.50" }}
                  borderRadius="md"
                  cursor="pointer"
                >
                  <Checkbox
                    isChecked={tempSelection.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                  >
                    {option.label}
                  </Checkbox>
                </Box>
              ))
            ) : (
              <Box p={2} textAlign="center" color="gray.500" fontSize="sm">
                Ничего не найдено
              </Box>
            )}
          </Box>
        </VStack>
      </MenuList>
    </Menu>
  );
};

export default FilterDropdown;
