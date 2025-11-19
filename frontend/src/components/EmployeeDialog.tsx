import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Box,
  Badge,
} from "@chakra-ui/react";
import type { Employee } from "../types/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeDialog: React.FC<Props> = ({ isOpen, onClose, employee }) => {
  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {employee.name || `${employee.firstName || ""} ${employee.lastName || ""}`.trim()}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box>
            <Text>Email: {employee.email}</Text>
            <Text>Position: {employee.position}</Text>
            <Text>Department: {employee.department}</Text>
            <Text>Location: {employee.location || employee.city}</Text>
            {employee.skills.length > 0 && (
              <Box mt={2}>
                {employee.skills.map((skill) => (
                  <Badge key={skill} mr={1}>
                    {skill}
                  </Badge>
                ))}
              </Box>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeDialog;
