import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Center, Button, HStack, Text, Spinner } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@chakra-ui/react";
import dagre from "dagre";
import MainLayout from "../components/MainLayout";
import { legalEntitiesAPI, departmentsAPI } from "../lib/api";
import CreateLegalEntityModal from "../components/CreateLegalEntityModal";
import { useAuth } from "../context/AuthContext";
import { useDisclosure } from "@chakra-ui/react";
import DepartmentNode from "../components/DepartmentNode";
import LegalEntityNode from "../components/LegalEntityNode";
import DepartmentManageModal from "../components/DepartmentManageModal";
import EditLegalEntityModal from "../components/EditLegalEntityModal";
import EditDepartmentModal from "../components/EditDepartmentModal";

// Типы для узлов
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
}

interface LegalEntityNodeData extends Record<string, unknown> {
  name: string;
  onDelete?: () => void;
  canDelete?: boolean;
}

// Типы узлов для React Flow
type CustomNode = Node<DepartmentNodeData | LegalEntityNodeData>;

// Функция для применения dagre раскладки
const getLayoutedElements = (
  nodes: CustomNode[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // 100px по горизонтали
    ranksep: 50, // 50px по вертикали
  });

  // Стандартные размеры узлов
  const defaultWidth = 250;
  const defaultHeight = 120;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: defaultWidth,
      height: defaultHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - defaultWidth / 2,
        y: nodeWithPosition.y - defaultHeight / 2,
      },
      width: defaultWidth,
      height: defaultHeight,
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Компонент для автоматического fitView при загрузке
const FitViewOnLoad: React.FC<{ nodes: CustomNode[] }> = ({ nodes }) => {
  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (nodes.length > 0 && !hasFitted.current) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
        hasFitted.current = true;
      }, 100);
    }
  }, [nodes.length, fitView]);

  return null;
};

const nodeTypes = {
  department: DepartmentNode,
  legalEntity: LegalEntityNode,
} as any;

const TeamMapPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "HR_ADMIN";
  const queryClient = useQueryClient();
  const toast = useToast();
  const {
    isOpen: isCreateLegalEntityModalOpen,
    onOpen: onCreateLegalEntityModalOpen,
    onClose: onCreateLegalEntityModalClose,
  } = useDisclosure();

  // Состояние для модального окна управления отделом
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: string;
    name: string;
    legalEntityId: string;
    parentId?: string | null;
    currentManagerId?: string | null;
  } | null>(null);

  // Состояние для модального окна редактирования юридического лица
  const [editingLegalEntity, setEditingLegalEntity] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Состояние для модального окна редактирования отдела
  const [editingDepartment, setEditingDepartment] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Обработчик удаления юридического лица
  const handleDeleteLegalEntity = useCallback(
    async (entityId: string) => {
      if (
        !window.confirm("Вы уверены, что хотите удалить это юридическое лицо?")
      ) {
        return;
      }

      try {
        await legalEntitiesAPI.delete(entityId);
        toast({
          title: "Юридическое лицо удалено",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Инвалидируем кэш для обновления данных
        queryClient.invalidateQueries({ queryKey: ["legal-entities"] });
        queryClient.invalidateQueries({ queryKey: ["departments"] });
      } catch (error: any) {
        console.error("Ошибка при удалении юридического лица:", error);
        toast({
          title: "Ошибка при удалении",
          description:
            error?.message ||
            "Не удалось удалить юридическое лицо. Возможно, к нему привязаны отделы.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [queryClient, toast]
  );

  // Обработчик открытия модального окна редактирования юридического лица
  const handleEditLegalEntity = useCallback(
    (entityId: string, entityName: string) => {
      setEditingLegalEntity({ id: entityId, name: entityName });
    },
    []
  );

  // Обработчик открытия модального окна редактирования отдела
  const handleEditDepartment = useCallback(
    (departmentId: string, departmentName: string) => {
      setEditingDepartment({ id: departmentId, name: departmentName });
    },
    []
  );

  // Обработчик открытия модального окна управления отделом
  const handleOpenDepartmentManage = useCallback(
    (
      departmentId: string,
      departmentName: string,
      legalEntityId: string,
      parentId?: string | null,
      currentManagerId?: string | null
    ) => {
      setSelectedDepartment({
        id: departmentId,
        name: departmentName,
        legalEntityId,
        parentId,
        currentManagerId,
      });
    },
    []
  );

  // Загружаем юридические лица
  const {
    data: legalEntities = [],
    isLoading: isLegalEntitiesLoading,
    isError: isLegalEntitiesError,
    error: legalEntitiesError,
  } = useQuery({
    queryKey: ["legal-entities"],
    queryFn: () => legalEntitiesAPI.list(),
    retry: 1,
  });

  // Загружаем отделы
  const {
    data: departments = [],
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
    error: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        return await departmentsAPI.list();
      } catch (error) {
        console.error("Ошибка при загрузке отделов:", error);
        throw error;
      }
    },
    retry: 1,
  });

  const isLoading = isLegalEntitiesLoading || isDepartmentsLoading;
  const isError = isLegalEntitiesError || isDepartmentsError;

  // Строим узлы и рёбра из данных
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (isLoading || legalEntities.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: CustomNode[] = [];
    const edges: Edge[] = [];

    // Создаём Map для быстрого поиска отделов по ID
    const departmentsMap = new Map(departments.map((dept) => [dept.id, dept]));

    // Создаём узлы для юридических лиц
    legalEntities.forEach((entity) => {
      nodes.push({
        id: `entity-${entity.id}`,
        type: "legalEntity",
        data: {
          name: entity.name,
          onDelete: () => handleDeleteLegalEntity(entity.id),
          canDelete: isAdmin,
          onEdit: () => handleEditLegalEntity(entity.id, entity.name),
          canEdit: isAdmin,
        },
        position: { x: 0, y: 0 }, // Позиция будет рассчитана dagre
      });
    });

    // Создаём узлы для отделов
    departments.forEach((dept) => {
      nodes.push({
        id: `dept-${dept.id}`,
        type: "department",
        data: {
          name: dept.name,
          manager: dept.manager
            ? {
                first_name: dept.manager.first_name,
                last_name: dept.manager.last_name,
                position: dept.manager.position,
                photo_url: dept.manager.photo_url,
              }
            : null,
          employees: dept.employees
            ? dept.employees.map((emp: any) => ({
                id: emp.id || emp.user_id || String(emp),
                first_name: emp.first_name || "",
                last_name: emp.last_name || "",
                position: emp.position || null,
                photo_url: emp.photo_url || null,
              }))
            : [],
          onAdd: () =>
            handleOpenDepartmentManage(
              dept.id,
              dept.name,
              dept.legal_entity_id,
              dept.parent_id,
              dept.manager?.id || null
            ),
          canAdd: isAdmin,
          onEdit: () => handleEditDepartment(dept.id, dept.name),
          canEdit: isAdmin,
        },
        position: { x: 0, y: 0 }, // Позиция будет рассчитана dagre
      });
    });

    // Создаём рёбра
    departments.forEach((dept) => {
      if (dept.parent_id) {
        // Отдел привязан к родительскому отделу
        edges.push({
          id: `edge-dept-${dept.parent_id}-dept-${dept.id}`,
          source: `dept-${dept.parent_id}`,
          target: `dept-${dept.id}`,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      } else if (dept.legal_entity_id) {
        // Отдел привязан к юридическому лицу
        edges.push({
          id: `edge-entity-${dept.legal_entity_id}-dept-${dept.id}`,
          source: `entity-${dept.legal_entity_id}`,
          target: `dept-${dept.id}`,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    });

    // Применяем dagre раскладку
    if (nodes.length > 0) {
      return getLayoutedElements(nodes, edges, "TB");
    }

    return { nodes, edges };
  }, [
    legalEntities,
    departments,
    isLoading,
    isAdmin,
    handleDeleteLegalEntity,
    handleOpenDepartmentManage,
    handleEditLegalEntity,
    handleEditDepartment,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Используем ref для отслеживания предыдущих ID, чтобы избежать бесконечного цикла
  const prevNodeIdsRef = useRef<string>("");
  const prevEdgeIdsRef = useRef<string>("");

  // Обновляем узлы и рёбра при изменении данных
  useEffect(() => {
    const nodeIds = initialNodes
      .map((n) => n.id)
      .sort()
      .join(",");
    const edgeIds = initialEdges
      .map((e) => e.id)
      .sort()
      .join(",");

    // Обновляем только если структура действительно изменилась
    if (nodeIds !== prevNodeIdsRef.current) {
      setNodes(initialNodes);
      prevNodeIdsRef.current = nodeIds;
    }

    if (edgeIds !== prevEdgeIdsRef.current) {
      setEdges(initialEdges);
      prevEdgeIdsRef.current = edgeIds;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <MainLayout>
      <Box h="calc(100vh - 73px)" position="relative" bg="white">
        {isAdmin && (
          <Box position="absolute" top={4} right={4} zIndex={10}>
            <Button
              bg="#763186"
              color="white"
              _hover={{ bg: "#5a2568" }}
              leftIcon={<AddIcon />}
              onClick={onCreateLegalEntityModalOpen}
              size="md"
              boxShadow="md"
            >
              Создать юридическое лицо
            </Button>
          </Box>
        )}

        {isLoading && (
          <Center position="absolute" inset={0} bg="white" opacity={0.8}>
            <Spinner size="lg" color="purple.500" />
          </Center>
        )}

        {isError && (
          <Center position="absolute" inset={0} bg="white" opacity={0.8} p={4}>
            <Box textAlign="center">
              <Text color="red.500" mb={2}>
                Ошибка загрузки данных
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                {legalEntitiesError instanceof Error
                  ? legalEntitiesError.message
                  : departmentsError instanceof Error
                  ? departmentsError.message
                  : "Не удалось загрузить организационную структуру"}
              </Text>
              {(legalEntitiesError || departmentsError) && (
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Проверьте консоль браузера для деталей
                </Text>
              )}
            </Box>
          </Center>
        )}

        {!isLoading && !isError && nodes.length === 0 && (
          <Center position="absolute" inset={0} bg="white" opacity={0.8} p={4}>
            <Text color="gray.500">Нет данных для отображения</Text>
          </Center>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes as any}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f0f0f0" gap={16} />
          <Controls />
          <MiniMap
            nodeColor="#763186"
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{ backgroundColor: "#fff" }}
          />
          <FitViewOnLoad nodes={nodes} />
        </ReactFlow>
      </Box>

      {isAdmin && (
        <CreateLegalEntityModal
          isOpen={isCreateLegalEntityModalOpen}
          onClose={onCreateLegalEntityModalClose}
        />
      )}

      {selectedDepartment && (
        <DepartmentManageModal
          isOpen={!!selectedDepartment}
          onClose={() => setSelectedDepartment(null)}
          departmentId={selectedDepartment.id}
          departmentName={selectedDepartment.name}
          legalEntityId={selectedDepartment.legalEntityId}
          parentId={selectedDepartment.parentId}
          currentManagerId={selectedDepartment.currentManagerId}
        />
      )}

      {editingLegalEntity && (
        <EditLegalEntityModal
          isOpen={!!editingLegalEntity}
          onClose={() => setEditingLegalEntity(null)}
          legalEntityId={editingLegalEntity.id}
          currentName={editingLegalEntity.name}
        />
      )}

      {editingDepartment && (
        <EditDepartmentModal
          isOpen={!!editingDepartment}
          onClose={() => setEditingDepartment(null)}
          departmentId={editingDepartment.id}
          currentName={editingDepartment.name}
        />
      )}
    </MainLayout>
  );
};

export default TeamMapPage;
