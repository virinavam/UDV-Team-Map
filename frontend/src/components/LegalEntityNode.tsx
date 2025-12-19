import React, { useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Box, Text, IconButton, HStack } from "@chakra-ui/react";
import { DeleteIcon, EditIcon, AddIcon } from "@chakra-ui/icons";

interface LegalEntityNodeData extends Record<string, unknown> {
  name: string;
  onDelete?: () => void;
  canDelete?: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
  onAddDepartment?: () => void;
  canAddDepartment?: boolean;
}

const LegalEntityNode: React.FC<NodeProps<LegalEntityNodeData>> = (
  props: any
) => {
  const [isHovered, setIsHovered] = useState(false);
  const data = (props.data || {}) as LegalEntityNodeData;

  return (
    <Box
      bg="purple.600"
      color="white"
      borderRadius="lg"
      boxShadow="lg"
      border="2px solid"
      borderColor="purple.700"
      p={4}
      minW="200px"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Входной handle (сверху) - не нужен для корневых узлов, но оставим для консистентности */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 12, height: 12 }}
      />

      {/* Кнопки управления (появляются при наведении) */}
      {(data.canEdit || data.canDelete || data.canAddDepartment) && (
        <HStack
          position="absolute"
          top={1}
          right={2}
          spacing={1}
          opacity={isHovered ? 1 : 0}
          transition="opacity 0.2s"
        >
          {data.canAddDepartment && data.onAddDepartment && (
            <IconButton
              aria-label="Добавить отдел"
              icon={<AddIcon />}
              size="xs"
              colorScheme="green"
              variant="ghost"
              bg={isHovered ? "green.100" : "transparent"}
              _hover={{
                bg: "green.200",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onAddDepartment) {
                  data.onAddDepartment();
                }
              }}
            />
          )}
          {data.canEdit && data.onEdit && (
            <IconButton
              aria-label="Редактировать юридическое лицо"
              icon={<EditIcon />}
              size="xs"
              colorScheme="gray"
              variant="ghost"
              bg={isHovered ? "gray.100" : "transparent"}
              _hover={{
                bg: "gray.200",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onEdit) {
                  data.onEdit();
                }
              }}
            />
          )}
          {data.canDelete && data.onDelete && (
            <IconButton
              aria-label="Удалить юридическое лицо"
              icon={<DeleteIcon />}
              size="xs"
              colorScheme="red"
              variant="ghost"
              bg={isHovered ? "red.100" : "transparent"}
              _hover={{
                bg: "red.200",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onDelete) {
                  data.onDelete();
                }
              }}
            />
          )}
        </HStack>
      )}

      {/* Название юридического лица */}
      <Text fontWeight="bold" fontSize="xl" textAlign="center">
        {data.name}
      </Text>

      {/* Выходной handle (снизу) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 12, height: 12 }}
      />
    </Box>
  );
};

export default LegalEntityNode;
