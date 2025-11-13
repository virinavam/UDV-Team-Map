import type { OrgNode } from "../types/types";

export interface FlowNode<T = any> {
  id: string;
  type?: string;
  data: T;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export function convertOrgTreeToFlow(tree: OrgNode[]) {
  const nodes: FlowNode<OrgNode>[] = [];
  const edges: FlowEdge[] = [];

  const traverse = (node: OrgNode, parentId?: string, level = 0) => {
    nodes.push({
      id: node.id,
      type: "custom",
      data: node,
      position: { x: level * 250, y: nodes.length * 80 },
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        animated: false,
      });
    }

    node.children?.forEach((child) => traverse(child, node.id, level + 1));
  };

  tree.forEach((n) => traverse(n));
  return { nodes, edges };
}
