import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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

const TeamMapPage: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: treeData, isLoading: isTreeLoading } = useQuery({
    queryKey: ["org-tree"],
    queryFn: () => orgAPI.getTree(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", { scope: "team-map" }],
    queryFn: () => employeesAPI.list(),
  });

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const tree = treeData?.tree || [];
    return convertOrgTreeToFlow(tree);
  }, [treeData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ custom: OrgChartNode }), []);

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setNodes(initialNodes);
      return;
    }
    setNodes(
      initialNodes.map((node: any) => ({
        ...node,
        style: {
          ...(node.style || {}),
          opacity: node.data.name.toLowerCase().includes(query) ? 1 : 0.2,
        },
      }))
    );
  }, [initialNodes, searchQuery, setNodes]);

  const onNodeClick = useCallback((_e: any, node: any) => {
    if (node.data.type === "employee" && node.data.employeeId) {
      setSelectedEmployee(node.data.employeeId);
    }
  }, []);

  const employee = selectedEmployee
    ? employees.find((emp) => emp.id === selectedEmployee) || null
    : null;

  return (
    <MainLayout>
      <Box h="calc(100vh - 73px)" position="relative">
        <Box position="absolute" top={4} right={4} zIndex={10} w="260px">
          <InputGroup>
            <Input
              placeholder="Поиск по оргструктуре"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={handleSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              bg="white"
            />
            <InputRightElement>
              <SearchIcon color="gray.500" />
            </InputRightElement>
          </InputGroup>
        </Box>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {isTreeLoading && (
          <Center position="absolute" inset={0}>
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
