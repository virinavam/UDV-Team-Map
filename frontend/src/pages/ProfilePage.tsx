import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  HStack,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon } from "@chakra-ui/icons";
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

  const handleSave = async () => {
    if (!editedEmployee) return;
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
      toast({ status: "success", title: "Профиль обновлен" });
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
      <Box p={6}>
        <HStack spacing={4} mb={6} justify="space-between">
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
          {!isEditMode && (
            <Button
              leftIcon={<EditIcon />}
              variant="outline"
              onClick={() => setIsEditMode(true)}
            >
              Редактировать
            </Button>
          )}
        </HStack>

        <Box bg="white" borderRadius="lg" p={8} boxShadow="sm">
          {isEditMode && editedEmployee ? (
            <ProfileEditForm
              employee={editedEmployee}
              onFieldChange={handleFieldChange}
              onAvatarSelect={handleAvatarSelect}
              onCancel={handleCancel}
              onSave={handleSave}
              isSaving={isSaving}
            />
          ) : (
            <ProfileView employee={employee} />
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default ProfilePage;





