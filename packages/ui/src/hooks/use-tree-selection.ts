"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useTreeAdapter } from "../sidebar/tree-provider";
import type { SelectionApi, TreeNodeRecord } from "../lib/tree/types";

/**
 * Multi-select over a flattened tree. `visibleOrder` must be exactly what is
 * on screen — shift-range walks it, so a stale order selects the wrong rows.
 */
export function useTreeSelection(
  nodes: TreeNodeRecord[] | undefined,
  visibleOrder: string[],
): SelectionApi {
  const adapter = useTreeAdapter();
  const [rawSelected, setSelectedIds] = useState<Set<string>>(() => new Set());
  const anchorId = useRef<string | null>(null);

  /*
   * Deleted rows are pruned here rather than in an effect. An effect would
   * mean an extra render pass on every tree change, and for one frame the
   * UI would still be holding ids that no longer exist.
   */
  const selectedIds = useMemo(() => {
    if (!nodes || rawSelected.size === 0) return rawSelected;
    const live = new Set(nodes.map((n) => n.id));
    let changed = false;
    const next = new Set<string>();
    for (const id of rawSelected) {
      if (live.has(id)) next.add(id);
      else changed = true;
    }
    return changed ? next : rawSelected;
  }, [nodes, rawSelected]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return useMemo<SelectionApi>(
    () => ({
      selectedIds,
      clear,
      onItemClick: (id, e) => {
        if (e.shiftKey && anchorId.current) {
          const a = visibleOrder.indexOf(anchorId.current);
          const b = visibleOrder.indexOf(id);
          if (a !== -1 && b !== -1) {
            const [lo, hi] = a < b ? [a, b] : [b, a];
            setSelectedIds(new Set(visibleOrder.slice(lo, hi + 1)));
            return;
          }
        }
        if (e.metaKey || e.ctrlKey) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
          anchorId.current = id;
          return;
        }
        setSelectedIds(new Set([id]));
        anchorId.current = id;
      },
      ensureSelected: (id) => {
        setSelectedIds((prev) => {
          if (prev.has(id)) return prev;
          anchorId.current = id;
          return new Set([id]);
        });
      },
      deleteSelectionOr: (id) => {
        // Right-clicking one row of a multi-selection deletes the whole set.
        const ids =
          selectedIds.size > 1 && selectedIds.has(id) ? [...selectedIds] : [id];
        setSelectedIds(new Set());
        void adapter.remove(ids);
      },
    }),
    [adapter, clear, selectedIds, visibleOrder],
  );
}
