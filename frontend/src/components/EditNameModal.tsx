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

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  title: string;
  onSave: (newName: string) => Promise<void>;
}

const EditNameModal: React.FC<EditNameModalProps> = ({
  isOpen,
  onClose,
  currentName,
  title,
  onSave,
}) => {
  const toast = useToast();
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

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

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(name.trim());
      toast({
        title: "Название обновлено",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      console.error("Ошибка при обновлении названия:", error);
      toast({
        title: "Ошибка при обновлении названия",
        description: error?.message || "Не удалось обновить название",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Название</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isSaving) {
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
            isLoading={isSaving}
            isDisabled={!name.trim()}
          >
            Сохранить
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditNameModal;
