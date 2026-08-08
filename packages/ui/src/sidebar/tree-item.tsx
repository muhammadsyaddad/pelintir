"use client";

import { AnimatePresence } from "framer-motion";
import { SidebarMenu } from "../ui/sidebar";

import { FileLeaf } from "./file-leaf";
import { FolderItem } from "./folder-item";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

/** Dispatcher. Filtered-out nodes render nothing at all. */
export function TreeItem({ node, level }: { node: TreeNode; level: number }) {
  const { filterVisible } = useTreeUI();
  if (filterVisible && !filterVisible.has(node.id)) return null;
  return node.kind === "file" ? (
    <FileLeaf node={node} level={level} />
  ) : (
    <FolderItem node={node} level={level} />
  );
}

/**
 * One list of siblings. `initial={false}` keeps the first paint still —
 * only rows that appear or vanish afterwards animate.
 */
export function TreeItemList({
  nodes,
  level,
  className,
}: {
  nodes: TreeNode[];
  level: number;
  className?: string;
}) {
  return (
    <SidebarMenu className={className ?? "gap-0"}>
      <AnimatePresence initial={false}>
        {nodes.map((node) => (
          <TreeItem key={node.id} node={node} level={level} />
        ))}
      </AnimatePresence>
    </SidebarMenu>
  );
}
