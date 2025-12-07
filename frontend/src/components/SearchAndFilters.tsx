import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  VStack,
  HStack,
  Checkbox,
  Radio,
  RadioGroup,
  Text,
  Icon,
} from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  cities: string[];
  skills: string[];
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  selectedSkills,
  onSkillsChange,
  cities,
  skills,
}) => {
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [tempCity, setTempCity] = useState(selectedCity);
  const [tempSkills, setTempSkills] = useState<string[]>(selectedSkills);

  // Sync temp values when popovers open
  useEffect(() => {
    if (isCityOpen) {
      setTempCity(selectedCity);
    }
  }, [isCityOpen, selectedCity]);

  useEffect(() => {
    if (isSkillsOpen) {
      setTempSkills(selectedSkills);
    }
  }, [isSkillsOpen, selectedSkills]);

  const handleCityApply = () => {
    onCityChange(tempCity);
    setIsCityOpen(false);
  };

  const handleCityReset = () => {
    setTempCity("");
    onCityChange("");
    setIsCityOpen(false);
  };

  const handleSkillToggle = (skill: string) => {
    if (tempSkills.includes(skill)) {
      setTempSkills(tempSkills.filter((s) => s !== skill));
    } else {
      setTempSkills([...tempSkills, skill]);
    }
  };

  const handleSkillsApply = () => {
    onSkillsChange(tempSkills);
    setIsSkillsOpen(false);
  };

  const handleSkillsReset = () => {
    setTempSkills([]);
    onSkillsChange([]);
    setIsSkillsOpen(false);
  };

  return (
    <Flex
      gap={4}
      px={6}
      py={4}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
    >
      {/* Search Bar */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        p={0}
        gap="4px"
        flex={1}
        minW="400px"
        h="44px"
      >
        <InputGroup w="100%" h="44px">
          <InputLeftElement pointerEvents="none" h="44px">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Поиск: фамилия, имя, должность, навыки (например: 'Иванов React Senior Engineer')"
            value={searchQuery}
            onChange={(e) => {
              // Поиск работает мгновенно при вводе каждой буквы
              onSearchChange(e.target.value);
            }}
            bg="white"
            borderColor="gray.300"
            h="44px"
            autoComplete="off"
          />
        </InputGroup>
      </Box>

      {/* City Filter */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        p={0}
        gap="4px"
        w="200px"
        h="44px"
      >
        <Popover
          isOpen={isCityOpen}
          onOpen={() => setIsCityOpen(true)}
          onClose={() => setIsCityOpen(false)}
          placement="bottom-start"
        >
          <PopoverTrigger>
            <Button
              leftIcon={
                <Box
                  as="img"
                  src="/filter.svg"
                  alt="Filter"
                  w="16px"
                  h="14px"
                />
              }
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              borderColor="gray.300"
              bg="white"
              _hover={{ bg: "gray.50" }}
              h="44px"
              w="100%"
            >
              Город
              {selectedCity && (
                <Box
                  ml={2}
                  minW="20px"
                  h="20px"
                  borderRadius="full"
                  bg="rgba(121, 129, 140, 0.12)"
                  color="#79818C"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  fontWeight="semibold"
                  px={1.5}
                >
                  1
                </Box>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent w="250px">
            <PopoverBody p={0}>
              <VStack align="stretch" spacing={0}>
                <Flex
                  justify="space-between"
                  p={3}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Button
                    size="sm"
                    bg="#763186" // фон кнопки
                    color="white" // цвет текста
                    _hover={{ bg: "#763186" }} // цвет при наведении (не менять)
                    onClick={handleCityApply}
                  >
                    Применить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCityReset}>
                    Сбросить
                  </Button>
                </Flex>
                <Box p={3}>
                  <RadioGroup
                    value={tempCity}
                    onChange={(value) => setTempCity(value)}
                  >
                    <VStack align="start" spacing={2}>
                      {cities.map((city) => (
                        <Radio key={city} value={city}>
                          {city}
                        </Radio>
                      ))}
                    </VStack>
                  </RadioGroup>
                </Box>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>

      {/* Skills Filter */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        p={0}
        gap="4px"
        w="200px"
        h="44px"
      >
        <Popover
          isOpen={isSkillsOpen}
          onOpen={() => setIsSkillsOpen(true)}
          onClose={() => setIsSkillsOpen(false)}
          placement="bottom-start"
        >
          <PopoverTrigger>
            <Button
              leftIcon={
                <Box
                  as="img"
                  src="/filter.svg"
                  alt="Filter"
                  w="16px"
                  h="14px"
                />
              }
              rightIcon={<ChevronDownIcon />}
              variant="outline"
              borderColor="gray.300"
              bg="white"
              _hover={{ bg: "gray.50" }}
              h="44px"
              w="100%"
            >
              Навыки
              {selectedSkills.length > 0 && (
                <Box
                  ml={2}
                  minW="20px"
                  h="20px"
                  borderRadius="full"
                  bg="rgba(121, 129, 140, 0.12)"
                  color="#79818C"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  fontWeight="semibold"
                  px={1.5}
                >
                  {selectedSkills.length}
                </Box>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent w="300px" maxH="400px" overflowY="auto">
            <PopoverBody p={0}>
              <VStack align="stretch" spacing={0}>
                <Flex
                  justify="space-between"
                  p={3}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Button
                    size="sm"
                    bg="#763186" // фон кнопки
                    color="white" // цвет текста
                    _hover={{ bg: "#763186" }} // цвет при наведении (не менять)
                    onClick={handleSkillsApply}
                  >
                    Применить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleSkillsReset}>
                    Сбросить
                  </Button>
                </Flex>
                <Box p={3}>
                  <VStack align="start" spacing={2}>
                    {skills.map((skill) => (
                      <Checkbox
                        key={skill}
                        isChecked={tempSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
    </Flex>
  );
};

export default SearchAndFilters;
