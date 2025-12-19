import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useToast,
} from "@chakra-ui/react";
import { legalEntitiesAPI } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface CreateLegalEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateLegalEntityModal: React.FC<CreateLegalEntityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    // Валидация
    if (!name.trim()) {
      setError("Название юридического лица обязательно");
      return;
    }

    if (name.trim().length < 2) {
      setError("Название должно содержать минимум 2 символа");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await legalEntitiesAPI.create(name.trim());
      toast({
        status: "success",
        title: "Юридическое лицо создано",
        description: `"${name.trim()}" успешно добавлено`,
        duration: 3000,
        isClosable: true,
      });
      // Инвалидируем кеш юридических лиц, чтобы обновить карту
      queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
      setName("");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось создать юридическое лицо";
      setError(errorMessage);
      toast({
        status: "error",
        title: "Ошибка",
        description: errorMessage,
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Создать юридическое лицо</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={!!error}>
            <FormLabel>Название юридического лица</FormLabel>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Введите название"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleSubmit();
                }
              }}
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Отмена
          </Button>
          <Button
            bg="#763186"
            color="white"
            _hover={{ bg: "#5a2568" }}
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!name.trim()}
          >
            Создать
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateLegalEntityModal;
