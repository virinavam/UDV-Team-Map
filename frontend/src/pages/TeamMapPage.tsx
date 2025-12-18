import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Box,
  Center,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import OrgChartNode from "../components/OrgChartNode";
import EmployeeDialog from "../components/EmployeeDialog";
import MainLayout from "../components/MainLayout";
import { convertOrgTreeToFlow } from "../lib/org-tree-utils";
import { employeesAPI, orgAPI } from "../lib/api";
import type { OrgNode } from "../types/types";

const TeamMapPage: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // По умолчанию все узлы развернуты
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: treeData, isLoading: isTreeLoading } = useQuery({
    queryKey: ["org-tree"],
    queryFn: () => orgAPI.getTree(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", { scope: "team-map" }],
    queryFn: () => employeesAPI.list(),
  });

  // Создаем Map для быстрого поиска руководителей по названию отдела
  const departmentManagerMap = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((emp) => {
      if (emp.departmentFull) {
        const parts = emp.departmentFull.split(" / ");
        parts.forEach((part) => {
          if (part && !map.has(part)) {
            const name = `${emp.lastName} ${emp.firstName}`.trim();
            if (name) {
              map.set(part, name);
            }
          }
        });
      }
      if (emp.department && !map.has(emp.department)) {
        const name = `${emp.lastName} ${emp.firstName}`.trim();
        if (name) {
          map.set(emp.department, name);
        }
      }
    });
    return map;
  }, [employees]);

  // Обогащаем данные узлов информацией о руководителях и добавляем сотрудников
  const enrichNodeData = useCallback(
    (node: OrgNode): OrgNode & { managerName?: string } => {
      let managerName: string | undefined;
      if ((node.type === "team" || node.type === "department") && node.name) {
        managerName = departmentManagerMap.get(node.name);
      }

      // Обрабатываем дочерние узлы
      let enrichedChildren =
        node.children?.map((child) => enrichNodeData(child)) || [];

      // Добавляем данные о сотрудниках для узла "Направление аналитики и документации"
      let departmentEmployees: any[] = [];
      if (node.name === "Направление аналитики и документации") {
        // Находим сотрудников, которые относятся к этому направлению
        departmentEmployees = employees
          .filter((emp) => {
            const hasGroup =
              emp.group === "Направление аналитики и документации";
            const hasDepartmentFull = emp.departmentFull?.includes(
              "Направление аналитики и документации"
            );
            return hasGroup || hasDepartmentFull;
          })
          .map((emp) => ({
            id: emp.id,
            name: emp.name,
            photoUrl: emp.photoUrl,
          }));
      }

      return {
        ...node,
        managerName,
        children: enrichedChildren,
        employees:
          departmentEmployees.length > 0 ? departmentEmployees : undefined,
      };
    },
    [departmentManagerMap, employees]
  );

  // Собираем все ID узлов, которые имеют дочерние элементы или сотрудников (для разворачивания по умолчанию)
  const getAllNodeIds = useCallback((nodes: OrgNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (node: OrgNode & { employees?: any[] }) => {
      const hasChildren = node.children && node.children.length > 0;
      const hasEmployees = node.employees && node.employees.length > 0;
      if (hasChildren || hasEmployees) {
        ids.push(node.id);
      }
      if (hasChildren) {
        node.children!.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return ids;
  }, []);

  // Инициализируем expandedNodes при загрузке дерева
  useEffect(() => {
    if (treeData?.tree && employees.length > 0) {
      // Обогащаем дерево данными о сотрудниках перед сбором ID
      const enrichedTree = treeData.tree.map((node) => enrichNodeData(node));
      const allIds = getAllNodeIds(enrichedTree);
      setExpandedNodes(new Set(allIds));
    } else if (treeData?.tree) {
      const allIds = getAllNodeIds(treeData.tree);
      setExpandedNodes(new Set(allIds));
    }
  }, [treeData, employees, enrichNodeData, getAllNodeIds]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!treeData?.tree || treeData.tree.length === 0) {
      return { nodes: [], edges: [] };
    }
    try {
      const enrichedTree = treeData.tree.map((node) => enrichNodeData(node));
      return convertOrgTreeToFlow(enrichedTree, expandedNodes);
    } catch (error) {
      console.error("Error converting org tree to flow:", error);
      return { nodes: [], edges: [] };
    }
  }, [treeData?.tree, expandedNodes, enrichNodeData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Обновляем узлы только при изменении структуры (добавление/удаление узлов)
  // Сохраняем позиции при перетаскивании
  useEffect(() => {
    // Проверяем, изменилась ли структура узлов (количество или ID)
    const initialIds = initialNodes
      .map((n) => n.id)
      .sort()
      .join(",");
    const currentIds = nodes
      .map((n) => n.id)
      .sort()
      .join(",");

    if (initialIds !== currentIds) {
      // Структура изменилась - обновляем узлы, но сохраняем позиции существующих
      const positionMap = new Map(nodes.map((n) => [n.id, n.position]));
      const updatedNodes = initialNodes.map((node) => ({
        ...node,
        position: positionMap.get(node.id) || node.position,
      }));
      setNodes(updatedNodes);
    }
  }, [initialNodes, nodes, setNodes]);

  // Обновляем рёбра при изменении структуры
  useEffect(() => {
    const initialEdgeIds = initialEdges
      .map((e) => e.id)
      .sort()
      .join(",");
    const currentEdgeIds = edges
      .map((e) => e.id)
      .sort()
      .join(",");

    if (initialEdgeIds !== currentEdgeIds) {
      setEdges(initialEdges);
    }
  }, [initialEdges, edges, setEdges]);

  // Обработчик сворачивания/разворачивания
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const nodeTypes = useMemo(() => ({ custom: OrgChartNode }), []);

  // Обогащаем узлы функциями и применяем фильтр поиска
  const displayNodes = useMemo(() => {
    const nodesToUse = nodes.length > 0 ? nodes : initialNodes;
    if (nodesToUse.length === 0) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    return nodesToUse.map((node: Node) => {
      // Создаем новый объект data, чтобы не мутировать оригинал
      const nodeData = node.data || {};
      const enrichedNode = {
        ...node,
        data: {
          ...nodeData,
          onToggleExpand: () => handleToggleExpand(node.id),
          // Сохраняем employees из исходных данных
          employees: nodeData.employees,
        },
      };

      // Применяем фильтр поиска
      if (query) {
        enrichedNode.style = {
          ...(node.style || {}),
          opacity: nodeData?.name?.toLowerCase().includes(query) ? 1 : 0.2,
        };
      }

      return enrichedNode;
    });
  }, [nodes, initialNodes, handleToggleExpand, searchQuery]);

  const onNodeClick = useCallback((_e: any, node: Node) => {
    if (node.data.type === "employee" && node.data.employeeId) {
      setSelectedEmployee(node.data.employeeId);
    }
  }, []);

  const employee = selectedEmployee
    ? employees.find((emp) => emp.id === selectedEmployee) || null
    : null;

  return (
    <MainLayout>
      <Box h="calc(100vh - 73px)" position="relative" bg="white">
        <Box position="absolute" top={4} right={4} zIndex={10} w="260px">
          <InputGroup>
            <Input
              placeholder="Поиск по оргструктуре"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              bg="white"
              autoComplete="off"
            />
            <InputRightElement>
              <SearchIcon color="gray.500" />
            </InputRightElement>
          </InputGroup>
        </Box>

        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView={!isTreeLoading}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          defaultEdgeOptions={{
            style: { stroke: "#000", strokeWidth: 1 },
            markerEnd: { type: "arrowclosed", color: "#000" },
          }}
          connectionLineStyle={{ stroke: "#000", strokeWidth: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f0f0f0" gap={16} />
          <Controls />
          <MiniMap
            nodeColor="#763186"
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{ backgroundColor: "#fff" }}
          />
        </ReactFlow>

        {isTreeLoading && (
          <Center position="absolute" inset={0} bg="white" opacity={0.8}>
            Загрузка оргструктуры...
          </Center>
        )}
      </Box>

      <EmployeeDialog
        isOpen={!!employee}
        onClose={() => setSelectedEmployee(null)}
        employee={employee}
      />
    </MainLayout>
  );
};

export default TeamMapPage;
