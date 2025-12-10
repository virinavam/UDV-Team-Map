/**
 * Компонент заголовка профиля с кнопками навигации
 */

import React from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import { ArrowBackIcon, EditIcon, CloseIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  isEditMode: boolean;
  onEditClick: () => void;
  onCancelClick: () => void;
  canEdit?: boolean; // Может ли пользователь редактировать этот профиль
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditMode,
  onEditClick,
  onCancelClick,
  canEdit = true, // По умолчанию разрешено редактирование
}) => {
  const navigate = useNavigate();

  return (
    <HStack spacing={4} mb={6} justify="space-between">
      <Button
        leftIcon={<ArrowBackIcon />}
        variant="ghost"
        colorScheme="purple"
        onClick={() => navigate(-1)}
      >
        ← Назад
      </Button>
      {canEdit && (
        <>
          {isEditMode ? (
            <Button
              leftIcon={<CloseIcon />}
              variant="ghost"
              colorScheme="purple"
              onClick={onCancelClick}
            >
              Закрыть
            </Button>
          ) : (
            <Button
              leftIcon={<EditIcon />}
              colorScheme="purple"
              onClick={onEditClick}
            >
              Редактировать
            </Button>
          )}
        </>
      )}
    </HStack>
  );
};

