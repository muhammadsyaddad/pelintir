"use client";

import * as React from "react";

import type { MotionConfig } from "../lib/motion/variants";
import type { DndApi, NodeKind, SelectionApi } from "../lib/tree/types";

/**
 * Everything a row needs that isn't the row itself. Without this the tree's
 * recursive shape forces ten props through every level — which is exactly
 * how the original 673-line component got that way.
 */
export type TreeUI = {
  activeId: string | null;
  onSelect: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  commitRename: (id: string, name: string) => void;
  create: (kind: NodeKind, parentId: string | null) => void;
  setCollapsed: (id: string, collapsed: boolean) => void;
  /** `null` when no search is active. */
  filterVisible: Set<string> | null;
  selection: SelectionApi;
  dnd: DndApi;
  motion: MotionConfig;
};

const TreeUIContext = React.createContext<TreeUI | null>(null);

export function TreeUIProvider({
  value,
  children,
}: {
  value: TreeUI;
  children: React.ReactNode;
}) {
  return (
    <TreeUIContext.Provider value={value}>{children}</TreeUIContext.Provider>
  );
}

export function useTreeUI(): TreeUI {
  const ctx = React.useContext(TreeUIContext);
  if (!ctx) throw new Error("useTreeUI must be used inside <TreeUIProvider>");
  return ctx;
}
