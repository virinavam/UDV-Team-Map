import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Center, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/MainLayout";
import ProfileView from "../components/profile/ProfileView";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileConfirmModals } from "../components/profile/ProfileConfirmModals";
import { ProfileNotFound } from "../components/profile/ProfileNotFound";
import { employeesAPI } from "../lib/api";
import { useProfileEdit } from "../hooks/useProfileEdit";
import { useAuth } from "../context/AuthContext";
import type { Employee } from "../types/types";
import { useDisclosure } from "@chakra-ui/react";

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);

  // Модальные окна подтверждения
  const {
    isOpen: isSaveConfirmOpen,
    onOpen: onSaveConfirmOpen,
    onClose: onSaveConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isFinalConfirmOpen,
    onOpen: onFinalConfirmOpen,
    onClose: onFinalConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isCancelConfirmOpen,
    onOpen: onCancelConfirmOpen,
    onClose: onCancelConfirmClose,
  } = useDisclosure();

  const {
    data: employee,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      try {
        return await employeesAPI.getById(id!);
      } catch (err) {
        // Преобразуем ошибку в более понятный формат
        if (err instanceof Error) {
          // Если это 404, создаем специальную ошибку
          if (err.message.includes("404") || err.message.includes("not found")) {
            throw new Error("Сотрудник не найден");
          }
        }
        throw err;
      }
    },
    enabled: Boolean(id),
    retry: false,
    // Обрабатываем ошибки через isError
    throwOnError: false,
  });

  // Хук для управления редактированием
  const {
    isSaving,
    pendingAvatarFile,
    setPendingAvatarFile,
    saveEmployee,
  } = useProfileEdit({
    employeeId: id || "",
    onSuccess: () => {
      setIsEditMode(false);
    },
  });

  useEffect(() => {
    if (employee) {
      setEditedEmployee(employee);
    }
  }, [employee]);

  // Проверяем, может ли пользователь редактировать этот профиль
  // Сотрудники могут редактировать только свой профиль
  // Администраторы могут редактировать любой профиль
  const canEdit = useMemo(() => {
    if (!user || !employee) return false;
    const isAdmin = user.role === "SYSTEM_ADMIN" || user.role === "HR_ADMIN";
    const isOwnProfile = user.id === employee.id || user.email === employee.email;
    return isAdmin || isOwnProfile;
  }, [user, employee]);

  // Обработчики событий
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
    onSaveConfirmOpen();
  };

  const handleSaveConfirmYes = () => {
    onSaveConfirmClose();
    onFinalConfirmOpen();
  };

  const handleSaveConfirmNo = () => {
    onSaveConfirmClose();
    onCancelConfirmOpen();
  };

  const handleFinalConfirm = async () => {
    if (!editedEmployee) return;
    onFinalConfirmClose();

    const updated = await saveEmployee(editedEmployee);
    if (updated) {
      // Обновляем editedEmployee после успешного сохранения
      setEditedEmployee(updated);
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

  // Состояние загрузки
  if (isLoading) {
    return (
      <MainLayout>
        <Center h="70vh">
          <Spinner size="lg" color="purple.500" />
        </Center>
      </MainLayout>
    );
  }

  // Обработка ошибок: сотрудник не найден или ошибка загрузки
  if (isError || !employee) {
    return <ProfileNotFound error={error as Error | null} />;
  }

  return (
    <MainLayout>
      <Box p={6} bg="gray.50" minH="100vh">
        <ProfileHeader
          isEditMode={isEditMode}
          onEditClick={() => setIsEditMode(true)}
          onCancelClick={handleCancel}
          canEdit={canEdit}
        />

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

      <ProfileConfirmModals
        isSaveConfirmOpen={isSaveConfirmOpen}
        onSaveConfirmClose={onSaveConfirmClose}
        onSaveConfirmYes={handleSaveConfirmYes}
        onSaveConfirmNo={handleSaveConfirmNo}
        isFinalConfirmOpen={isFinalConfirmOpen}
        onFinalConfirmClose={onFinalConfirmClose}
        onFinalConfirm={handleFinalConfirm}
        isCancelConfirmOpen={isCancelConfirmOpen}
        onCancelConfirmClose={onCancelConfirmClose}
        onCancelConfirmYes={handleCancelConfirmYes}
        isSaving={isSaving}
      />
    </MainLayout>
  );
};

export default ProfilePage;






