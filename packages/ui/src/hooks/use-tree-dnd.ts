"use client";

import { useMemo, useRef, useState } from "react";

import { useTreeAdapter } from "../sidebar/tree-provider";
import type { DndApi, SelectionApi } from "../lib/tree/types";

/** Sentinel id for the root drop zone — `null` is a legal parent, so it can't double as "nothing". */
export const ROOT_DROP = "__root__";

/**
 * Native HTML5 drag-and-drop. The dragged ids also ride in `dataTransfer`
 * so a drop still resolves if the ref was cleared mid-gesture (which happens
 * when the source row unmounts because search filtered it out).
 */
export function useTreeDnd(selection: SelectionApi): DndApi {
  const adapter = useTreeAdapter();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragIds = useRef<string[]>([]);

  const { selectedIds, ensureSelected } = selection;

  return useMemo<DndApi>(
    () => ({
      dropTargetId,
      onDragStart: (id, e) => {
        const ids = selectedIds.has(id) ? [...selectedIds] : [id];
        if (!selectedIds.has(id)) ensureSelected(id);
        dragIds.current = ids;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(ids));
      },
      onDragEnd: () => {
        dragIds.current = [];
        setDropTargetId(null);
      },
      onDragOverFolder: (id, e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDropTargetId(id);
      },
      onDropFolder: (folderId, e) => {
        e.preventDefault();
        e.stopPropagation();
        let ids = dragIds.current;
        if (ids.length === 0) {
          try {
            const parsed: unknown = JSON.parse(
              e.dataTransfer.getData("text/plain"),
            );
            ids = Array.isArray(parsed) ? (parsed as string[]) : [];
          } catch {
            ids = [];
          }
        }
        // The adapter owns the cycle guard; a bad drop is a no-op, not a throw.
        if (ids.length) void adapter.move(ids, folderId);
        dragIds.current = [];
        setDropTargetId(null);
      },
      onDragLeaveFolder: () => setDropTargetId(null),
    }),
    [adapter, dropTargetId, ensureSelected, selectedIds],
  );
}
