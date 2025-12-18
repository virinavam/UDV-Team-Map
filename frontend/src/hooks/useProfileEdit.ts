/**
 * Хук для управления редактированием профиля сотрудника
 */

import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import type { Employee } from "../types/types";
import { employeesAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  trimAndValidate,
  isNotEmpty,
  validateMaxLength,
  validateEmail,
  validatePhone,
  FIELD_MAX_LENGTHS,
} from "../lib/validation";

interface UseProfileEditOptions {
  employeeId: string;
  onSuccess?: () => void;
}

export const useProfileEdit = ({
  employeeId,
  onSuccess,
}: UseProfileEditOptions) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Проверяем, является ли пользователь админом или HR
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN";

  const validateEmployeeData = useCallback(
    (employee: Employee): string | null => {
      if (!isNotEmpty(employee.firstName)) {
        return "Имя обязательно для заполнения";
      }
      if (!isNotEmpty(employee.lastName)) {
        return "Фамилия обязательна для заполнения";
      }
      if (!isNotEmpty(employee.email)) {
        return "Email обязателен для заполнения";
      }
      if (!validateEmail(employee.email)) {
        return "Некорректный email адрес";
      }
      if (
        employee.firstName &&
        !validateMaxLength(employee.firstName, FIELD_MAX_LENGTHS.firstName)
      ) {
        return `Имя не должно превышать ${FIELD_MAX_LENGTHS.firstName} символов`;
      }
      if (
        employee.lastName &&
        !validateMaxLength(employee.lastName, FIELD_MAX_LENGTHS.lastName)
      ) {
        return `Фамилия не должна превышать ${FIELD_MAX_LENGTHS.lastName} символов`;
      }
      if (
        employee.email &&
        !validateMaxLength(employee.email, FIELD_MAX_LENGTHS.email)
      ) {
        return `Email не должен превышать ${FIELD_MAX_LENGTHS.email} символов`;
      }
      if (employee.phone && !validatePhone(employee.phone)) {
        return "Некорректный формат телефона";
      }
      if (
        employee.phone &&
        !validateMaxLength(employee.phone, FIELD_MAX_LENGTHS.phone)
      ) {
        return `Телефон не должен превышать ${FIELD_MAX_LENGTHS.phone} символов`;
      }
      return null;
    },
    []
  );

  const saveEmployee = useCallback(
    async (editedEmployee: Employee): Promise<Employee | false> => {
      // Валидация перед сохранением
      const validationError = validateEmployeeData(editedEmployee);
      if (validationError) {
        toast({
          status: "error",
          title: "Ошибка валидации",
          description: validationError,
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      setIsSaving(true);
      try {
        // Обрезаем пробелы из всех строковых полей
        let payload: Partial<Employee> = {
          ...editedEmployee,
          firstName: trimAndValidate(editedEmployee.firstName),
          lastName: trimAndValidate(editedEmployee.lastName),
          email: trimAndValidate(editedEmployee.email),
          phone: trimAndValidate(editedEmployee.phone),
          city: trimAndValidate(editedEmployee.city),
          position: trimAndValidate(editedEmployee.position),
          telegram: trimAndValidate(editedEmployee.telegram),
          mattermost: trimAndValidate(editedEmployee.mattermost),
          managerName: trimAndValidate(editedEmployee.managerName),
        };

        // Загружаем аватар, если он был выбран
        if (pendingAvatarFile) {
          try {
            toast({
              status: "info",
              title: "Загрузка аватара...",
              description: "Пожалуйста, подождите",
              duration: 2000,
              isClosable: true,
            });

            // Загружаем аватар
            await employeesAPI.uploadAvatar(
              editedEmployee.id,
              pendingAvatarFile,
              isAdmin // Для админов/HR используем no_moderation
            );

            // ВАЖНО: Получаем обновленные данные сотрудника из бэка, чтобы получить актуальный photo_url
            // Делаем небольшую задержку, чтобы бэк успел обработать загрузку
            await new Promise((resolve) => setTimeout(resolve, 500));

            const refreshedEmployee = await employeesAPI.getById(
              editedEmployee.id
            );

            // Обновляем photoUrl в payload с актуальными данными из бэка
            if (refreshedEmployee?.photoUrl) {
              payload.photoUrl = refreshedEmployee.photoUrl;
            }

            toast({
              status: "success",
              title: isAdmin
                ? "Аватар загружен и активирован"
                : "Аватар загружен",
              description: isAdmin
                ? "Фотография активирована без модерации"
                : "Фотография отправлена на модерацию",
              duration: 2000,
              isClosable: true,
            });
          } catch (avatarError) {
            toast({
              status: "error",
              title: "Ошибка загрузки аватара",
              description:
                avatarError instanceof Error
                  ? avatarError.message
                  : "Не удалось загрузить аватар",
              duration: 5000,
              isClosable: true,
            });
            // Прерываем сохранение, если загрузка аватара не удалась
            setIsSaving(false);
            return false;
          }
        }

        // Обновляем данные сотрудника
        const updated = await employeesAPI.update(editedEmployee.id, payload);

        // ВАЖНО: Получаем обновленные данные сотрудника из бэка после сохранения,
        // чтобы получить актуальный photo_url (если аватар был загружен)
        let finalUpdated = updated;
        if (pendingAvatarFile) {
          try {
            // Делаем небольшую задержку, чтобы бэк успел обработать изменения
            await new Promise((resolve) => setTimeout(resolve, 500));
            finalUpdated = await employeesAPI.getById(editedEmployee.id);
          } catch (refreshError) {
            console.warn(
              "Не удалось получить обновленные данные сотрудника после сохранения:",
              refreshError
            );
            // Используем данные из update, если не удалось получить свежие данные
          }
        }

        // Инвалидируем кэш и обновляем данные
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.setQueryData(["employee", editedEmployee.id], finalUpdated);

        setPendingAvatarFile(null);

        toast({
          status: "success",
          title: "Изменения сохранены",
          description: "Изменения отправлены на проверку модератору",
          duration: 5000,
          isClosable: true,
        });

        onSuccess?.();
        return finalUpdated;
      } catch (err) {
        toast({
          status: "error",
          title: "Не удалось сохранить изменения",
          description:
            err instanceof Error
              ? err.message
              : "Произошла ошибка при сохранении",
          duration: 5000,
          isClosable: true,
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      pendingAvatarFile,
      validateEmployeeData,
      toast,
      queryClient,
      onSuccess,
      employeeId,
      isAdmin,
      user,
    ]
  );

  return {
    isSaving,
    pendingAvatarFile,
    setPendingAvatarFile,
    saveEmployee,
    validateEmployeeData,
  };
};
