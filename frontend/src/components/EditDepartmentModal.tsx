import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { departmentsAPI } from "../lib/api";

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  currentName: string;
}

const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  currentName,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновляем имя при изменении currentName
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Название не может быть пустым",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentsAPI.update(departmentId, { name: name.trim() });
      toast({
        title: "Отдел обновлен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      onClose();
    } catch (error: any) {
      console.error("Ошибка при обновлении отдела:", error);
      toast({
        title: "Ошибка при обновлении",
        description: error?.message || "Не удалось обновить отдел",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Редактировать отдел</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Название</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название отдела"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleSave();
                }
              }}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Отмена
          </Button>
          <Button
            bg="#763186"
            color="white"
            _hover={{ bg: "#5a2568" }}
            onClick={handleSave}
            isLoading={isSubmitting}
            isDisabled={!name.trim() || name.trim() === currentName}
          >
            Сохранить
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditDepartmentModal;
