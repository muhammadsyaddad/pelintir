import { movableIds, nextPosition, withDescendants } from "./build-tree";
import { newId } from "./new-id";
import type { CreateOptions, TreeAdapter, TreeNodeRecord } from "./types";

/**
 * The zero-dependency reference adapter. Everything lives in one array that
 * is replaced (never mutated) on write, so `getSnapshot` stays referentially
 * stable between changes — the one hard requirement `useSyncExternalStore`
 * puts on a store.
 *
 * `initial` is called for the starting state and again on `reset`, so it must
 * return a fresh array each time. The app passes nothing and starts empty; the
 * tests pass a fixture.
 */
export function createMemoryAdapter(
  initial: () => TreeNodeRecord[] = () => [],
): TreeAdapter {
  let nodes: TreeNodeRecord[] = initial();
  const listeners = new Set<() => void>();

  const commit = (next: TreeNodeRecord[]) => {
    nodes = next;
    for (const l of listeners) l();
  };

  const patch = (id: string, fields: Partial<TreeNodeRecord>) =>
    nodes.map((n) => (n.id === id ? { ...n, ...fields } : n));

  return {
    id: "memory",
    label: "In-memory",

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot() {
      return nodes;
    },

    async create(opts: CreateOptions) {
      const id = newId(opts.kind === "folder" ? "f" : "n");
      const now = Date.now();
      const record: TreeNodeRecord = {
        id,
        kind: opts.kind,
        name:
          opts.name ??
          (opts.kind === "folder" ? "Folder tanpa judul" : "Tanpa judul"),
        parentId: opts.parentId,
        position: nextPosition(opts.parentId, nodes),
        collapsed: opts.kind === "folder" ? false : true,
        text: "",
        createdAt: now,
        updatedAt: now,
      };
      // Auto-expand the parent so the new node is actually visible.
      const next = nodes.map((n) =>
        n.id === opts.parentId ? { ...n, collapsed: false } : n,
      );
      commit([...next, record]);
      return id;
    },

    async rename(id, name) {
      commit(patch(id, { name, updatedAt: Date.now() }));
    },

    async setCollapsed(id, collapsed) {
      commit(patch(id, { collapsed }));
    },

    async remove(ids) {
      if (ids.length === 0) return;
      const doomed = new Set(withDescendants(ids, nodes));
      commit(nodes.filter((n) => !doomed.has(n.id)));
    },

    async move(ids, newParentId) {
      const moves = movableIds(ids, newParentId, nodes);
      if (moves.length === 0) return;
      const base = nextPosition(newParentId, nodes);
      const now = Date.now();
      const moving = new Map(moves.map((id, i) => [id, base + i]));
      commit(
        nodes.map((n) => {
          if (moving.has(n.id)) {
            return {
              ...n,
              parentId: newParentId,
              position: moving.get(n.id)!,
              updatedAt: now,
            };
          }
          if (n.id === newParentId) return { ...n, collapsed: false };
          return n;
        }),
      );
    },

    async reset() {
      commit(initial());
    },
  };
}
