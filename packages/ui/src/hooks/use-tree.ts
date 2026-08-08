"use client";

import { useMemo, useSyncExternalStore } from "react";

import { buildTree } from "../lib/tree/build-tree";
import { useTreeAdapter } from "../sidebar/tree-provider";
import type { TreeNode, TreeNodeRecord } from "../lib/tree/types";

const serverSnapshot = () => undefined;

export function useTree(): {
  nodes: TreeNodeRecord[] | undefined;
  tree: TreeNode[];
  loading: boolean;
} {
  const adapter = useTreeAdapter();
  const nodes = useSyncExternalStore(
    adapter.subscribe,
    adapter.getSnapshot,
    serverSnapshot,
  );
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  return { nodes, tree, loading: nodes === undefined };
}
