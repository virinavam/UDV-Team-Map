declare module "reactflow" {
  import type { ComponentType } from "react";

  export const ReactFlow: ComponentType<any>;
  export const Background: ComponentType<any>;
  export const Controls: ComponentType<any>;
  export const MiniMap: ComponentType<any>;
  export const useNodesState: any;
  export const useEdgesState: any;
  export type NodeTypes = Record<string, ComponentType<any>>;
}
