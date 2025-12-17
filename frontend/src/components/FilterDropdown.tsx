import React, { useState, useEffect } from "react";
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

  // Синхронизация временного выбора с внешними selectedValues только когда меню закрыто
  useEffect(() => {
    if (!isOpen) {
      setTempSelection(selectedValues);
    }
  }, [selectedValues, isOpen]);

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

  // Отображение выбранных опций
  const count = selectedValues.length;
  const hasSelection = count > 0;

  // Получаем метки выбранных значений
  const selectedLabels = selectedValues
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean) as string[];

  // Формируем текст для отображения
  let displayLabel = label;
  if (hasSelection) {
    if (showCount) {
      // Показываем количество и первые 2 значения
      const preview = selectedLabels.slice(0, 2).join(", ");
      const more = count > 2 ? ` +${count - 2}` : "";
      displayLabel = `${label}: ${preview}${more}`;
    } else {
      // Показываем только количество
      displayLabel = `${label} (${count})`;
    }
  }

  // При закрытии меню без применения - восстанавливаем временные значения из выбранных
  const handleClose = () => {
    setTempSelection(selectedValues);
    onClose();
  };

  return (
    <Menu isOpen={isOpen} onOpen={onOpen} onClose={handleClose}>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant={hasSelection ? "solid" : "outline"}
        colorScheme={hasSelection ? "purple" : undefined}
        size="md"
        bg={hasSelection ? "#763186" : "white"}
        color={hasSelection ? "white" : undefined}
        _hover={{
          bg: hasSelection ? "#5e2770" : "gray.50",
        }}
        borderColor={hasSelection ? "#763186" : "gray.200"}
        borderWidth="1px"
      >
        {displayLabel}
      </MenuButton>

      <MenuList minW="200px" p={4}>
        <VStack align="stretch" spacing={3}>
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
            {options.map((option) => (
              <MenuItem key={option.value} cursor="default">
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
