import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import OrgChartNode from "../components/OrgChartNode";
import EmployeeDialog from "../components/EmployeeDialog";
import Header from "../components/Header";
import { mockOrgTree, mockEmployees } from "../lib/mock-data";
import { convertOrgTreeToFlow } from "../lib/org-tree-utils";
import { Box } from "@chakra-ui/react";
import type { OrgNode } from "../types/types";

interface TeamMapPageProps {
  onNavigate: (page: "team-map" | "employees") => void;
}

export default function TeamMapPage({ onNavigate }: TeamMapPageProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return convertOrgTreeToFlow(mockOrgTree);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ custom: OrgChartNode }), []);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setNodes(initialNodes);
      return;
    }

    const q = searchQuery.toLowerCase();
    setNodes(
      initialNodes.map((n: any) => ({
        ...n,
        style: {
          ...(n.style || {}),
          opacity: n.data.name.toLowerCase().includes(q) ? 1 : 0.3,
        },
      }))
    );
  }, [searchQuery, initialNodes, setNodes]);

  const onNodeClick = useCallback((_e: any, node: any) => {
    if (node.data.type === "employee" && node.data.employeeId) {
      setSelectedEmployee(node.data.employeeId);
    }
  }, []);

  const employee = selectedEmployee
    ? mockEmployees.find((e) => e.id === selectedEmployee)
    : null;

  return (
    <Box h="100vh" w="100vw" bg="gray.50">
      <Header currentPage="team-map" onNavigate={onNavigate} />
      <Box h="calc(100vh - 73px)">
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
      </Box>

      <EmployeeDialog
        isOpen={!!employee}
        onClose={() => setSelectedEmployee(null)}
        employee={employee || null}
      />
    </Box>
  );
}
