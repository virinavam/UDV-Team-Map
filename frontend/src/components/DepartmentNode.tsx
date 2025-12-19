import React, { useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Box,
  Text,
  HStack,
  VStack,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@chakra-ui/icons";
import AuthorizedAvatar from "./AuthorizedAvatar";

interface DepartmentNodeData extends Record<string, unknown> {
  name: string;
  manager?: {
    first_name: string;
    last_name: string;
    position: string | null;
    photo_url: string | null;
  } | null;
  employees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    position: string | null;
    photo_url: string | null;
  }>;
  onAdd?: () => void;
  canAdd?: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
}

const DepartmentNode: React.FC<NodeProps<DepartmentNodeData>> = (
  props: any
) => {
  const [isHovered, setIsHovered] = useState(false);
  const data = (props.data || {}) as DepartmentNodeData;
  const managerName = data.manager
    ? `${data.manager.last_name || ""} ${data.manager.first_name || ""}`.trim()
    : null;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      border="2px solid"
      borderColor="#763186.500"
      p={4}
      minW="200px"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Входной handle (сверху) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 12, height: 12 }}
      />

      {/* Кнопки управления (появляются при наведении) */}
      {(data.canAdd || data.canEdit) && (
        <VStack
          position="absolute"
          top={1}
          right={2}
          spacing={1}
          zIndex={10}
          opacity={isHovered ? 1 : 0.3}
          transition="opacity 0.2s"
        >
          {/* Кнопка добавления */}
          {data.canAdd && data.onAdd && (
            <IconButton
              aria-label="Добавить подотдел или сотрудников"
              icon={<AddIcon />}
              size="xs"
              colorScheme="gray"
              variant="ghost"
              bg={isHovered ? "gray.100" : "gray.50"}
              _hover={{
                bg: "gray.200",
                opacity: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onAdd) {
                  data.onAdd();
                }
              }}
            />
          )}
          {/* Кнопка редактирования (под кнопкой +) */}
          {data.canEdit && data.onEdit && (
            <IconButton
              aria-label="Редактировать отдел"
              icon={<EditIcon />}
              size="xs"
              colorScheme="gray"
              variant="ghost"
              bg={isHovered ? "gray.100" : "gray.50"}
              _hover={{
                bg: "gray.200",
                opacity: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (data.onEdit) {
                  data.onEdit();
                }
              }}
            />
          )}
        </VStack>
      )}

      {/* Имя отдела */}
      <Text fontWeight="bold" fontSize="lg" color="gray.800" mb={2}>
        {data.name}
      </Text>

      {/* Информация о менеджере */}
      {data.manager && (
        <VStack align="stretch" mt={3} spacing={2}>
          <Divider borderColor="gray.200" />
          <HStack spacing={3} align="flex-start">
            {/* Аватарка */}
            <Box flexShrink={0}>
              <AuthorizedAvatar
                src={data.manager.photo_url || undefined}
                name={managerName || ""}
                size="sm"
              />
            </Box>

            {/* ФИО и должность */}
            <VStack align="flex-start" spacing={0} flex={1} minW={0}>
              {managerName && (
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  color="gray.700"
                  isTruncated
                  width="100%"
                >
                  {managerName}
                </Text>
              )}
              {data.manager.position && (
                <Text fontSize="xs" color="gray.500" isTruncated width="100%">
                  {data.manager.position}
                </Text>
              )}
            </VStack>
          </HStack>
        </VStack>
      )}

      {/* Список сотрудников отдела (как на макете - вложенный прямоугольник) */}
      {data.employees && data.employees.length > 0 && (
        <Box mt={3}>
          <Box
            bg="gray.50"
            borderRadius="md"
            p={2}
            border="1px solid"
            borderColor="gray.200"
          >
            <VStack align="stretch" spacing={1.5}>
              {data.employees.map((employee) => {
                const employeeName = `${employee.last_name || ""} ${
                  employee.first_name || ""
                }`.trim();
                return (
                  <HStack key={employee.id} spacing={2} align="center" py={0.5}>
                    <Box flexShrink={0}>
                      <AuthorizedAvatar
                        src={employee.photo_url || undefined}
                        name={employeeName || ""}
                        size="xs"
                      />
                    </Box>
                    <Text fontSize="sm" color="gray.700" flex={1} isTruncated>
                      {employeeName}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>
          </Box>
        </Box>
      )}

      {/* Выходной handle (снизу) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 12, height: 12 }}
      />
    </Box>
  );
};

export default DepartmentNode;
