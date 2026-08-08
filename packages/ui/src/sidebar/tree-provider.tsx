"use client";

import * as React from "react";

import { createMemoryAdapter } from "../lib/tree/memory-adapter";
import type { TreeAdapter } from "../lib/tree/types";

/**
 * Built once and cached. Constructing an adapter during render would hand
 * `useSyncExternalStore` a new `subscribe` every time and re-subscribe forever.
 *
 * The tree lives in memory only, so it resets on every reload. To back it with
 * real data, implement `TreeAdapter` from `../lib/tree/types` and return it
 * here — no component changes needed. Two rules that adapter must honour:
 * `getSnapshot()` returns the same array reference until the data actually
 * changes, and `remove` cascades while `move` refuses cycles (`withDescendants`
 * and `movableIds` in `../lib/tree/build-tree` do both).
 */
let cached: TreeAdapter | null = null;

function getAdapter(): TreeAdapter {
  cached ??= createMemoryAdapter();
  return cached;
}

const TreeAdapterContext = React.createContext<TreeAdapter | null>(null);

export function TreeAdapterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const adapter = React.useMemo(() => getAdapter(), []);
  return (
    <TreeAdapterContext.Provider value={adapter}>
      {children}
    </TreeAdapterContext.Provider>
  );
}

export function useTreeAdapter(): TreeAdapter {
  const adapter = React.useContext(TreeAdapterContext);
  if (!adapter) {
    throw new Error("useTreeAdapter must be used inside <TreeAdapterProvider>");
  }
  return adapter;
}
