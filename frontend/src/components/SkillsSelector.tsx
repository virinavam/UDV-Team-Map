import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Input,
  VStack,
  HStack,
  Badge,
  IconButton,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { skillsAPI } from "../lib/api";

interface SkillsSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  isReadOnly?: boolean;
}

/**
 * Компонент для выбора навыков с автокомплитом
 * Позволяет выбирать из существующих навыков или создавать новые
 */
const SkillsSelector: React.FC<SkillsSelectorProps> = ({
  selectedSkills,
  onChange,
  isReadOnly = false,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Загружаем список всех навыков
  const { data: allSkills = [], isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const skills = await skillsAPI.list();
      console.log("Загружены навыки из бэкенда:", skills);
      return skills;
    },
  });

  // Создаем список названий навыков для автокомплита
  const skillNames = useMemo(() => {
    const names = allSkills.map((skill) => skill.name);
    console.log("Список названий навыков для автокомплита:", names);
    return names;
  }, [allSkills]);

  // Фильтруем предложения на основе ввода
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const trimmed = inputValue.trim().toLowerCase();
    const filtered = skillNames.filter(
      (name) =>
        name.toLowerCase().includes(trimmed) && !selectedSkills.includes(name)
    );
    setSuggestions(filtered.slice(0, 5)); // Показываем максимум 5 предложений
  }, [inputValue, skillNames, selectedSkills]);

  // Обработка выбора навыка из списка
  const handleSelectSkill = (skillName: string) => {
    if (!selectedSkills.includes(skillName)) {
      onChange([...selectedSkills, skillName]);
    }
    setInputValue("");
    setSuggestions([]);
    // Вернуть фокус в инпут после выбора
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Обработка добавления нового навыка
  const handleAddNewSkill = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Проверяем, не выбран ли уже этот навык
    if (selectedSkills.includes(trimmed)) {
      toast({
        status: "warning",
        title: "Навык уже добавлен",
        description: `Навык "${trimmed}" уже в списке`,
        duration: 2000,
        isClosable: true,
      });
      setInputValue("");
      return;
    }

    // Проверяем, существует ли навык в списке (регистронезависимо)
    const existingSkill = skillNames.find(
      (name) => name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingSkill) {
      // Если навык существует, используем его точное название
      handleSelectSkill(existingSkill);
      return;
    }

    // Если навыка нет, создаем его
    setIsCreating(true);
    try {
      await skillsAPI.create(trimmed);

      // Инвалидируем кеш навыков, чтобы обновить список
      queryClient.invalidateQueries({ queryKey: ["skills"] });

      // Добавляем новый навык в список выбранных
      onChange([...selectedSkills, trimmed]);
      setInputValue("");
      // Вернуть фокус в инпут после создания
      setTimeout(() => inputRef.current?.focus(), 0);
      toast({
        status: "success",
        title: "Навык создан",
        description: `Навык "${trimmed}" успешно создан и добавлен`,
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при создании навыка:", error);
      toast({
        status: "error",
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось создать навык",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Обработка удаления навыка
  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(selectedSkills.filter((skill) => skill !== skillToRemove));
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        // Если есть предложения, выбираем первое
        handleSelectSkill(suggestions[0]);
      } else {
        // Иначе создаем новый навык
        handleAddNewSkill();
      }
    }
  };

  if (isReadOnly) {
    return (
      <FormControl>
        <FormLabel>Навыки</FormLabel>
        <HStack spacing={2} flexWrap="wrap">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill, index) => (
              <Badge
                key={index}
                px={3}
                py={1}
                borderRadius="md"
                bg="green.100"
                color="green.800"
                fontSize="sm"
                fontWeight="medium"
              >
                {skill}
              </Badge>
            ))
          ) : (
            <Box color="gray.400" fontSize="sm">
              Нет навыков
            </Box>
          )}
        </HStack>
      </FormControl>
    );
  }

  return (
    <FormControl>
      <FormLabel>Навыки</FormLabel>
      <VStack spacing={2} align="stretch">
        {/* Выбранные навыки */}
        {selectedSkills.length > 0 && (
          <HStack spacing={2} flexWrap="wrap">
            {selectedSkills.map((skill, index) => (
              <Badge
                key={index}
                px={3}
                py={1}
                borderRadius="md"
                bg="green.100"
                color="green.800"
                fontSize="sm"
                fontWeight="medium"
                display="flex"
                alignItems="center"
                gap={1}
              >
                {skill}
                <IconButton
                  aria-label="Удалить навык"
                  icon={<CloseIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => handleRemoveSkill(skill)}
                  h="16px"
                  minW="16px"
                />
              </Badge>
            ))}
          </HStack>
        )}

        {/* Поле ввода с автокомплитом */}
        <Box position="relative">
          <HStack spacing={2}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              placeholder={
                isLoading
                  ? "Загрузка навыков..."
                  : "Введите название навыка или выберите из списка"
              }
              disabled={isCreating || isLoading}
            />
            <IconButton
              aria-label="Добавить навык"
              icon={<AddIcon />}
              onClick={handleAddNewSkill}
              colorScheme="green"
              isLoading={isCreating}
              isDisabled={!inputValue.trim() || isCreating || isLoading}
            />
          </HStack>

          {/* Выпадающий список предложений */}
          {suggestions.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              zIndex={10}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="md"
              mt={1}
              maxH="200px"
              overflowY="auto"
            >
              <VStack align="stretch" spacing={0}>
                {suggestions.map((skill, index) => (
                  <Box
                    key={index}
                    px={4}
                    py={2}
                    cursor="pointer"
                    _hover={{ bg: "gray.100" }}
                    onClick={() => handleSelectSkill(skill)}
                  >
                    {skill}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </Box>

        {/* Подсказка */}
        <Box fontSize="xs" color="gray.500">
          Начните вводить название навыка для поиска или создайте новый. Нажмите
          Enter для быстрого добавления.
        </Box>
      </VStack>
    </FormControl>
  );
};

export default SkillsSelector;
