import React from "react";
import { Box, Select, Stack } from "@chakra-ui/react";

interface FiltersPanelProps {
  department: string;
  setDepartment: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  department,
  setDepartment,
  location,
  setLocation,
  role,
  setRole,
}) => {
  return (
    <Stack
      direction="row"
      spacing={4}
      p={3}
      bg="gray.50"
      borderRadius="md"
      mb={4}
    >
      <Select
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      >
        <option value="Engineering">Engineering</option>
        <option value="HR">HR</option>
      </Select>
      <Select
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      >
        <option value="New York">New York</option>
        <option value="London">London</option>
      </Select>
      <Select
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="Manager">Manager</option>
        <option value="Developer">Developer</option>
      </Select>
    </Stack>
  );
};

export default FiltersPanel;
