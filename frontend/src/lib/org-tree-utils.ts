import type { OrgNode } from "../types/types";

export interface FlowNode<T = any> {
  id: string;
  type?: string;
  data: T;
  position: { x: number; y: number };
  draggable?: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: any;
}

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const defaultConfig: LayoutConfig = {
  nodeWidth: 240,
  nodeHeight: 100,
  horizontalSpacing: 350,
  verticalSpacing: 200,
};

export function convertOrgTreeToFlow(
  tree: OrgNode[],
  expandedNodes: Set<string> = new Set(),
  config: LayoutConfig = defaultConfig
) {
  const nodes: FlowNode<OrgNode>[] = [];
  const edges: FlowEdge[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();
  const parentMap = new Map<string, string | null>(); // Карта родительских узлов

  // Мемоизация ширины поддерева для оптимизации
  const subtreeWidthCache = new Map<string, number>();

  // Вспомогательная функция для поиска узла по ID
  const findNodeById = (nodes: OrgNode[], id: string): OrgNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Сначала строим карту родителей
  const buildParentMap = (node: OrgNode, parentId: string | null) => {
    parentMap.set(node.id, parentId);
    node.children?.forEach((child) => buildParentMap(child, node.id));
  };
  tree.forEach((rootNode) => buildParentMap(rootNode, null));

  // Проверяем, виден ли узел (все родители должны быть развернуты)
  const isNodeVisible = (nodeId: string): boolean => {
    const parentId = parentMap.get(nodeId);
    if (!parentId) {
      return true; // Корневой узел всегда виден
    }
    // Проверяем, развернут ли родитель
    if (!expandedNodes.has(parentId)) {
      return false; // Родитель свернут - узел не виден
    }
    // Рекурсивно проверяем всех родителей
    return isNodeVisible(parentId);
  };

  // Вычисляем ширину поддерева (количество видимых узлов) с кешированием
  const getSubtreeWidth = (node: OrgNode): number => {
    if (subtreeWidthCache.has(node.id)) {
      return subtreeWidthCache.get(node.id)!;
    }

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    let width: number;
    if (!hasChildren || !isExpanded) {
      width = 1;
    } else {
      width = node.children!.reduce(
        (sum, child) => sum + getSubtreeWidth(child),
        0
      );
    }

    subtreeWidthCache.set(node.id, width);
    return width;
  };

  // Вычисляем позиции узлов с учетом иерархии
  const calculatePositions = (
    node: OrgNode,
    parentId: string | null,
    level: number,
    offset: number = 0
  ) => {
    // Проверяем, виден ли узел (все родители должны быть развернуты)
    const isVisible = isNodeVisible(node.id);

    // Если узел не виден, не добавляем его и его дочерние элементы
    if (!isVisible) {
      return;
    }

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const shouldShowChildren = isExpanded && hasChildren;

    // Вычисляем ширину поддерева
    const subtreeWidth = getSubtreeWidth(node);

    // Вычисляем позицию по горизонтали
    let x: number;
    if (!parentId) {
      // Корневой узел - центрируем по экрану
      x = 400; // Фиксированная позиция для корневого узла
    } else {
      const parentPos = nodePositions.get(parentId);
      if (parentPos) {
        // Для дочерних элементов: центрируем их относительно родителя
        // Находим родительский узел в дереве
        const parentNode = findNodeById(tree, parentId);
        if (
          parentNode &&
          parentNode.children &&
          parentNode.children.length > 0
        ) {
          // Вычисляем общую ширину всех видимых дочерних элементов
          const visibleChildren = parentNode.children.filter((child) =>
            isNodeVisible(child.id)
          );
          const totalChildrenWidth = visibleChildren.reduce(
            (sum, child) => sum + getSubtreeWidth(child),
            0
          );
          // Вычисляем начальный offset для центрирования
          const startOffset = -totalChildrenWidth / 2 + 0.5;
          // Находим индекс текущего узла среди видимых дочерних
          const currentIndex = visibleChildren.findIndex(
            (child) => child.id === node.id
          );
          let currentOffset = 0;
          for (let i = 0; i < currentIndex; i++) {
            currentOffset += getSubtreeWidth(visibleChildren[i]);
          }
          // Центрируем дочерние элементы относительно родителя
          x =
            parentPos.x +
            (startOffset + currentOffset) * config.horizontalSpacing;
        } else {
          // Fallback: позиционируем относительно родителя
          x =
            parentPos.x +
            (offset - subtreeWidth / 2 + 0.5) * config.horizontalSpacing;
        }
      } else {
        x = level * config.horizontalSpacing;
      }
    }

    // Вычисляем позицию по вертикали
    const y = level * config.verticalSpacing;

    nodePositions.set(node.id, { x, y });

    nodes.push({
      id: node.id,
      type: "custom",
      data: {
        ...node,
        isExpanded: shouldShowChildren || (node as any).employees?.length > 0, // Разворачиваем если есть сотрудники
      },
      position: { x, y },
      draggable: node.type !== "employee", // Сотрудники не перемещаются
    });

    // Добавляем ребро к родителю (если мы здесь, значит узел виден, а значит и родитель виден)
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        animated: false,
        style: { stroke: "#000", strokeWidth: 1 },
      });
    }

    // Обрабатываем дочерние узлы
    if (shouldShowChildren && node.children) {
      // Фильтруем только видимые дочерние узлы
      const visibleChildren = node.children.filter((child) =>
        isNodeVisible(child.id)
      );
      let childOffset = 0;
      visibleChildren.forEach((child) => {
        const childWidth = getSubtreeWidth(child);
        calculatePositions(child, node.id, level + 1, childOffset);
        childOffset += childWidth;
      });
    }
  };

  // Обрабатываем корневые узлы
  let rootOffset = 0;
  tree.forEach((rootNode) => {
    const rootWidth = getSubtreeWidth(rootNode);
    calculatePositions(rootNode, null, 0, rootOffset);
    rootOffset += rootWidth;
  });

  return { nodes, edges };
}
