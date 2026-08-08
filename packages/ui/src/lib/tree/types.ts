import type { DragEvent, MouseEvent } from "react";

export type NodeKind = "file" | "folder";

/** One row of the tree. Flat storage: nesting is `parentId`, order is `position`. */
export type TreeNodeRecord = {
  id: string;
  kind: NodeKind;
  name: string;
  parentId: string | null;
  /** Order within the parent. Gaps are fine; only relative order matters. */
  position: number;
  /** Persisted per node, so a folder stays shut across reloads. */
  collapsed: boolean;
  /** Optional searchable body. Search matches it as well as `name`. */
  text?: string;
  createdAt: number;
  updatedAt: number;
};

export type TreeNode = TreeNodeRecord & { children: TreeNode[] };

export type CreateOptions = {
  kind: NodeKind;
  parentId: string | null;
  name?: string;
};

/**
 * The one seam between the sidebar and wherever the data actually lives.
 * Swap the implementation and every interaction — rename, drag, cascade
 * delete, collapse — keeps working. One ships in the box: `memory-adapter`,
 * zero dependencies and no persistence.
 */
export type TreeAdapter = {
  readonly id: string;
  readonly label: string;
  /** Fires whenever nodes change. Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
  /**
   * MUST return the same reference until something actually changes —
   * `useSyncExternalStore` loops forever otherwise. `undefined` means
   * "still loading", which the sidebar renders as an empty state.
   */
  getSnapshot(): TreeNodeRecord[] | undefined;
  create(opts: CreateOptions): Promise<string>;
  rename(id: string, name: string): Promise<void>;
  setCollapsed(id: string, collapsed: boolean): Promise<void>;
  /** Cascade-deletes descendants. */
  remove(ids: string[]): Promise<void>;
  /** Re-parent with cycle guard; appends at the end of the target. */
  move(ids: string[], newParentId: string | null): Promise<void>;
  /** Wipe and restore the adapter's initial state. */
  reset(): Promise<void>;
};

/** Selection controller threaded down to every row. */
export type SelectionApi = {
  selectedIds: Set<string>;
  onItemClick: (id: string, e: MouseEvent) => void;
  ensureSelected: (id: string) => void;
  deleteSelectionOr: (id: string) => void;
  clear: () => void;
};

/** Native HTML5 drag-and-drop controller threaded down to every row. */
export type DndApi = {
  dropTargetId: string | null;
  onDragStart: (id: string, e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOverFolder: (id: string, e: DragEvent) => void;
  onDropFolder: (folderId: string | null, e: DragEvent) => void;
  onDragLeaveFolder: () => void;
};
