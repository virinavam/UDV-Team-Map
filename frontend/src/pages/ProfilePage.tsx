import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon, CloseIcon } from "@chakra-ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import ProfileView from "../components/profile/ProfileView";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import { employeesAPI } from "../lib/api";
import type { Employee } from "../types/types";

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Модальные окна подтверждения
  const { isOpen: isSaveConfirmOpen, onOpen: onSaveConfirmOpen, onClose: onSaveConfirmClose } = useDisclosure();
  const { isOpen: isFinalConfirmOpen, onOpen: onFinalConfirmOpen, onClose: onFinalConfirmClose } = useDisclosure();
  const { isOpen: isCancelConfirmOpen, onOpen: onCancelConfirmOpen, onClose: onCancelConfirmClose } = useDisclosure();
  
  // Тип подтверждения: 'save' для сохранения, 'cancel' для отмены
  const [confirmType, setConfirmType] = useState<'save' | 'cancel'>('save');

  const {
    data: employee,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeesAPI.getById(id!),
    enabled: Boolean(id),
    retry: false,
  });

  useEffect(() => {
    if (employee) {
      setEditedEmployee(employee);
    }
  }, [employee]);

  const handleFieldChange = (field: keyof Employee, value: any) => {
    setEditedEmployee((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAvatarSelect = (file: File) => {
    setPendingAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditedEmployee((prev) =>
      prev ? { ...prev, photoUrl: previewUrl } : prev
    );
  };

  const handleSaveClick = () => {
    setConfirmType('save');
    onSaveConfirmOpen();
  };

  const handleSaveConfirmYes = () => {
    onSaveConfirmClose();
    setConfirmType('save');
    onFinalConfirmOpen();
  };

  const handleSaveConfirmNo = () => {
    onSaveConfirmClose();
    setConfirmType('cancel');
    onCancelConfirmOpen();
  };

  const handleFinalConfirm = async () => {
    if (!editedEmployee) return;
    onFinalConfirmClose();
    setIsSaving(true);
    try {
      let payload: Partial<Employee> = { ...editedEmployee };
      if (pendingAvatarFile) {
        const { photoUrl } = await employeesAPI.uploadAvatar(
          editedEmployee.id,
          pendingAvatarFile
        );
        payload = { ...payload, photoUrl };
      }

      const updated = await employeesAPI.update(editedEmployee.id, payload);
      setEditedEmployee(updated);
      setPendingAvatarFile(null);
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.setQueryData(["employee", editedEmployee.id], updated);
      toast({ 
        status: "success", 
        title: "Изменения отправлены на проверку модератору",
        duration: 5000,
      });
    } catch (err) {
      toast({
        status: "error",
        title: "Не удалось сохранить изменения",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirmYes = () => {
    onCancelConfirmClose();
    setEditedEmployee(employee || null);
    setPendingAvatarFile(null);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditedEmployee(employee || null);
    setPendingAvatarFile(null);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Center h="70vh">
          <Spinner size="lg" color="purple.500" />
        </Center>
      </MainLayout>
    );
  }

  if (isError || !employee) {
    return (
      <MainLayout>
        <Center h="70vh" flexDirection="column" gap={4}>
          <Text color="red.500">
            {error instanceof Error ? error.message : "Сотрудник не найден"}
          </Text>
          <Button onClick={() => navigate(-1)}>Вернуться назад</Button>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box p={6} bg="gray.50" minH="100vh">
        <HStack spacing={4} mb={6} justify="space-between">
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            colorScheme="purple"
            onClick={() => navigate(-1)}
          >
            ← Назад
          </Button>
          {isEditMode ? (
            <Button
              leftIcon={<CloseIcon />}
              variant="ghost"
              colorScheme="purple"
              onClick={handleCancel}
            >
              Закрыть
            </Button>
          ) : (
            <Button
              leftIcon={<EditIcon />}
              colorScheme="purple"
              onClick={() => setIsEditMode(true)}
            >
              Редактировать
            </Button>
          )}
        </HStack>

        {isEditMode && editedEmployee ? (
          <Box
            bg="white"
            borderRadius="lg"
            p={8}
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
          >
            <ProfileEditForm
              employee={editedEmployee}
              onFieldChange={handleFieldChange}
              onAvatarSelect={handleAvatarSelect}
              onCancel={handleCancel}
              onSave={handleSaveClick}
              isSaving={isSaving}
            />
          </Box>
        ) : (
          <ProfileView employee={employee} />
        )}
      </Box>

      {/* Первое модальное окно подтверждения */}
      <Modal isOpen={isSaveConfirmOpen} onClose={onSaveConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сохранить изменения?</ModalHeader>
          <ModalBody>
            <Text>
              Примененные изменения будут отправлены на проверку модератору
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleSaveConfirmNo}
            >
              Нет
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleSaveConfirmYes}
            >
              Да
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Второе модальное окно подтверждения для сохранения */}
      <Modal isOpen={isFinalConfirmOpen && confirmType === 'save'} onClose={onFinalConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Уверены ли вы?</ModalHeader>
          <ModalBody>
            <Text>
              Вы уверены, что хотите отправить изменения на проверку?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onFinalConfirmClose}
            >
              Нет
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleFinalConfirm}
              isLoading={isSaving}
            >
              Да
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Второе модальное окно подтверждения для отмены */}
      <Modal isOpen={isCancelConfirmOpen} onClose={onCancelConfirmClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Вы уверены, что не хотите сохранять изменения?</ModalHeader>
          <ModalBody>
            <Text>
              Все внесенные изменения будут потеряны
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCancelConfirmClose}
            >
              Нет
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleCancelConfirmYes}
            >
              Да
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MainLayout>
  );
};

export default ProfilePage;






