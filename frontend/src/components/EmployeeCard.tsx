import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, VStack } from "@chakra-ui/react";
import { HStack, Text, Image } from "@chakra-ui/react";
import AuthorizedAvatar from "./AuthorizedAvatar";
import { getStatusConfig } from "../lib/status-utils";

interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    position: string;
    city: string;
    email: string;
    skills: string[];
    photoUrl?: string;
    status: "Активен" | "Не активен" | "В отпуске";
    mattermost?: string;
    telegram?: string;
    employmentStatus?: string; // ACTIVE, INACTIVE, VACATION, SICK, REMOTE, TRIP
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
      _hover={{
        boxShadow: "md",
        transform: "translateY(-2px)",
        cursor: "pointer",
      }}
      transition="all 0.2s"
      h="100%"
      display="flex"
      flexDirection="column"
      onClick={handleClick}
    >
      <VStack spacing={4} align="stretch" flex={1}>
        {/* Profile Picture */}
        <Box display="flex" justifyContent="center">
          <AuthorizedAvatar
            size="xl"
            name={employee.name}
            src={employee.photoUrl}
            bg="blue.100"
          />
        </Box>

        {/* Name */}
        <Box
          width="272px"
          height="28px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          margin="0 auto" // чтобы центрировать по горизонтали
        >
          <Text
            fontFamily="Golos, sans-serif"
            fontStyle="normal"
            fontWeight={700}
            fontSize="24px"
            lineHeight="28px"
            color="#0B2027"
          >
            {employee.name}
          </Text>
        </Box>

        {/* Status Badge */}
        {employee.employmentStatus && (
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            px={2}
            height="22px"
            bg={getStatusConfig(employee.employmentStatus).bgColor}
            borderRadius="30px"
            margin="0 auto"
          >
            <Box
              width="8px"
              height="8px"
              bg={getStatusConfig(employee.employmentStatus).dotColor}
              borderRadius="50%"
              mr={2}
            />
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={getStatusConfig(employee.employmentStatus).textColor}
            >
              {getStatusConfig(employee.employmentStatus).label}
            </Text>
          </Box>
        )}

        {/* Role with icon */}
        <HStack spacing={2} justify="center" align="center">
          {/* Union SVG Icon */}
          <Image
            src="/role.svg" // путь относительно public
            alt="Role icon"
            boxSize="16px" // ширина и высота
          />

          {/* Position text */}
          <Text fontSize="sm" fontWeight="medium" color="black">
            {employee.position}
          </Text>
        </HStack>

        {/* Location with icon */}
        <HStack spacing={2} justify="center" align="center">
          {/* Location SVG Icon */}
          <Image
            src="/location.svg" // путь относительно public
            alt="Location icon"
            boxSize="16px" // ширина и высота иконки
          />

          {/* City text */}
          <Text fontSize="sm" color="black">
            {employee.city}
          </Text>
        </HStack>

        {/* Divider line */}
        <Box
          height="1px" // толщина линии
          width="100%" // растянуть на всю ширину карточки
          bg="#E8E8E8" // цвет линии
          my={1} // отступ сверху и снизу
        />

        <HStack spacing={4} justify="center" align="center">
          {/* Email */}
          {employee.email && (
            <a
              href={`mailto:${employee.email}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/mail.svg" // путь к иконке в public
                alt="Email"
                boxSize="20px" // ширина и высота иконки
                cursor="pointer" // чтобы курсор менялся на pointer
              />
            </a>
          )}

          {/* Mattermost */}
          {employee.mattermost && (
            <a
              href={`mattermost://user?email=${employee.mattermost}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/mattermost.svg" alt="Mattermost" boxSize="20px" />
            </a>
          )}

          {/* Telegram */}
          {employee.telegram && (
            <a
              href={`https://t.me/${employee.telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image src="/telegram.svg" alt="Telegram" boxSize="20px" />
            </a>
          )}
        </HStack>

        {/* Skills */}
        {employee.skills && employee.skills.length > 0 && (
          <Box mt="auto" pt={2}>
            <HStack spacing={2} flexWrap="wrap" justify="center" align="center">
              {employee.skills.map((skill) => (
                <Box
                  key={skill}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  px={2} // горизонтальные отступы, текст растянет блок
                  height="22px" // фиксированная высота
                  bg="rgba(0, 210, 157, 0.12)" // зелёный фон
                  borderRadius="30px"
                  flex="none"
                  order={0}
                  flexGrow={0}
                >
                  <Text
                    fontStyle="normal"
                    fontWeight={500}
                    fontSize="13px"
                    lineHeight="16px"
                    color="rgba(25, 28, 48, 0.9)"
                    display="flex"
                    alignItems="center"
                    textAlign="center"
                  >
                    {skill}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default EmployeeCard;
