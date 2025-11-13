import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  Text,
  HStack,
  Avatar,
  Tag,
  TagLabel,
  Icon,
} from "@chakra-ui/react";
import { EmailIcon } from "@chakra-ui/icons";

interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    position: string;
    city: string;
    email: string;
    skills: string[];
    photoUrl?: string;
  };
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${employee.id}`);
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      p={6}
      boxShadow="sm"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)", cursor: "pointer" }}
      transition="all 0.2s"
      h="100%"
      display="flex"
      flexDirection="column"
      onClick={handleClick}
    >
      <VStack spacing={4} align="stretch" flex={1}>
        {/* Profile Picture */}
        <Box display="flex" justifyContent="center">
          <Avatar
            size="xl"
            name={employee.name}
            src={employee.photoUrl}
            bg="blue.100"
          />
        </Box>

        {/* Name */}
        <Text fontSize="lg" fontWeight="bold" textAlign="center" color="gray.800">
          {employee.name}
        </Text>

        {/* Role */}
        <HStack spacing={2} color="gray.600">
          <Icon viewBox="0 0 24 24" w={4} h={4}>
            <path
              fill="currentColor"
              d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
            />
          </Icon>
          <Text fontSize="sm">{employee.position}</Text>
        </HStack>

        {/* Location */}
        <HStack spacing={2} color="gray.600">
          <Icon viewBox="0 0 24 24" w={4} h={4}>
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </Icon>
          <Text fontSize="sm">{employee.city}</Text>
        </HStack>

        {/* Email */}
        <HStack spacing={2} color="gray.600">
          <EmailIcon w={4} h={4} />
          <Text fontSize="sm" isTruncated>
            {employee.email}
          </Text>
        </HStack>

        {/* Skills */}
        <Box mt="auto" pt={2}>
          <HStack spacing={2} flexWrap="wrap">
            {employee.skills.map((skill) => (
              <Tag
                key={skill}
                size="sm"
                bg="blue.50"
                color="blue.700"
                borderRadius="full"
              >
                <TagLabel>{skill}</TagLabel>
              </Tag>
            ))}
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default EmployeeCard;

