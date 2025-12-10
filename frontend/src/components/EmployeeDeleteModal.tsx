import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from "@chakra-ui/react";
import type { Employee } from "../types/types";

interface EmployeeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onConfirm: () => void;
}

const EmployeeDeleteModal: React.FC<EmployeeDeleteModalProps> = ({
  isOpen,
  onClose,
  employee,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Удалить сотрудника?</ModalHeader>
        <ModalBody>
          <Text>Вы уверены, что хотите удалить этого сотрудника?</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            bg="#763186"
            color="white"
            _hover={{ bg: "#5e2770" }}
            mr={3}
            onClick={handleConfirm}
          >
            Да
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Нет
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeDeleteModal;
