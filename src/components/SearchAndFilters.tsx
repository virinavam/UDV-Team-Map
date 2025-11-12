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
  Badge,
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
    <Flex gap={4} px={6} py={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
      {/* Search Bar */}
      <InputGroup flex={1} maxW="600px">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Поиск сотрудника по ФИО, должности и почте..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          bg="white"
          borderColor="gray.300"
        />
      </InputGroup>

      {/* City Filter */}
      <Popover
        isOpen={isCityOpen}
        onOpen={() => setIsCityOpen(true)}
        onClose={() => setIsCityOpen(false)}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <Button
            rightIcon={<ChevronDownIcon />}
            variant="outline"
            borderColor="gray.300"
            bg="white"
            _hover={{ bg: "gray.50" }}
          >
            Город
            {selectedCity && (
              <Badge ml={2} colorScheme="blue">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent w="250px">
          <PopoverBody p={0}>
            <VStack align="stretch" spacing={0}>
              <Flex justify="space-between" p={3} borderBottom="1px solid" borderColor="gray.200">
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleCityApply}
                >
                  Применить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCityReset}
                >
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

      {/* Skills Filter */}
      <Popover
        isOpen={isSkillsOpen}
        onOpen={() => setIsSkillsOpen(true)}
        onClose={() => setIsSkillsOpen(false)}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <Button
            rightIcon={<ChevronDownIcon />}
            variant="outline"
            borderColor="gray.300"
            bg="white"
            _hover={{ bg: "gray.50" }}
          >
            Навыки
            {selectedSkills.length > 0 && (
              <Badge ml={2} colorScheme="blue">
                {selectedSkills.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent w="300px" maxH="400px" overflowY="auto">
          <PopoverBody p={0}>
            <VStack align="stretch" spacing={0}>
              <Flex justify="space-between" p={3} borderBottom="1px solid" borderColor="gray.200">
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleSkillsApply}
                >
                  Применить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkillsReset}
                >
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
    </Flex>
  );
};

export default SearchAndFilters;

