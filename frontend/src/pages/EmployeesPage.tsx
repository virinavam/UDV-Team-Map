import React, {useState, useMemo} from "react";
import {Box, SimpleGrid} from "@chakra-ui/react";
import MainLayout from "../components/MainLayout";
import SearchAndFilters from "../components/SearchAndFilters";
import EmployeeCard from "../components/EmployeeCard";
import {mockEmployees} from "../lib/mock-data";

interface EmployeesPageProps {
}

const EmployeesPage: React.FC<EmployeesPageProps> = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    const cities = useMemo(() => {
        const citySet = new Set(mockEmployees.map((e) => e.city));
        return Array.from(citySet).sort();
    }, []);

    const skills = useMemo(() => {
        const skillSet = new Set<string>();
        mockEmployees.forEach((e) => {
            e.skills.forEach((skill) => skillSet.add(skill));
        });
        return Array.from(skillSet).sort();
    }, []);

    const filteredEmployees = useMemo(() => {
        return mockEmployees.filter((employee) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const searchableText =
                    `${employee.name} ${employee.position} ${employee.email}`.toLowerCase();
                if (!searchableText.includes(query)) {
                    return false;
                }
            }

            // City filter
            if (selectedCity && employee.city !== selectedCity) {
                return false;
            }

            // Skills filter
            if (selectedSkills.length > 0) {
                const hasSelectedSkill = selectedSkills.some((skill) =>
                    employee.skills.includes(skill)
                );
                if (!hasSelectedSkill) {
                    return false;
                }
            }

            return true;
        });
    }, [searchQuery, selectedCity, selectedSkills]);

    return (
        <MainLayout>
            <Box p={6}>
                <SearchAndFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCity={selectedCity}
                    onCityChange={setSelectedCity}
                    selectedSkills={selectedSkills}
                    onSkillsChange={setSelectedSkills}
                    cities={cities}
                    skills={skills}
                />
                <Box mt={6}>
                    <SimpleGrid columns={{base: 1, md: 2, lg: 3, xl: 4}} spacing={6}>
                        {filteredEmployees.map((employee) => (
                            <EmployeeCard key={employee.id} employee={employee}/>
                        ))}
                    </SimpleGrid>
                    {filteredEmployees.length === 0 && (
                        <Box textAlign="center" py={8}>
                            Сотрудники не найдены
                        </Box>
                    )}
                </Box>
            </Box>
        </MainLayout>
    );
};

export default EmployeesPage;
