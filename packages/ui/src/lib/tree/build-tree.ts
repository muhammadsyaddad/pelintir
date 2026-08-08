import type { TreeNode, TreeNodeRecord } from "./types";

/** Build a nested tree from flat rows. Folders sort before files at each level. */
export function buildTree(nodes: TreeNodeRecord[] | undefined): TreeNode[] {
  if (!nodes) return [];
  const map = new Map<string, TreeNode>();
  for (const n of nodes) {
    map.set(n.id, { ...n, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sorter = (a: TreeNode, b: TreeNode) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    if (a.position !== b.position) return a.position - b.position;
    return a.name.localeCompare(b.name);
  };
  const sortRec = (arr: TreeNode[]) => {
    arr.sort(sorter);
    arr.forEach((c) => sortRec(c.children));
  };
  sortRec(roots);
  return roots;
}

/**
 * Flatten the tree to render order, honoring collapse + the active filter.
 * Shift-range selection walks this list, so it must match what's on screen.
 */
export function buildVisibleOrder(
  tree: TreeNode[],
  filterVisible: Set<string> | null,
): string[] {
  const order: string[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (filterVisible && !filterVisible.has(n.id)) continue;
      order.push(n.id);
      if (n.kind === "folder") {
        // While filtering, every folder is force-opened so matches stay visible.
        const open = !!filterVisible || !n.collapsed;
        if (open) walk(n.children);
      }
    }
  };
  walk(tree);
  return order;
}

/** parentId -> direct child ids. */
export function childrenByParent(
  nodes: TreeNodeRecord[],
): Map<string | null, string[]> {
  const map = new Map<string | null, string[]>();
  for (const n of nodes) {
    const list = map.get(n.parentId) ?? [];
    list.push(n.id);
    map.set(n.parentId, list);
  }
  return map;
}

/** All descendant ids of `id` (excluding `id`), via the child map. */
export function collectDescendants(
  id: string,
  byParent: Map<string | null, string[]>,
): string[] {
  const out: string[] = [];
  const stack = [...(byParent.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur);
    const kids = byParent.get(cur);
    if (kids) stack.push(...kids);
  }
  return out;
}

/**
 * Which of `ids` may legally move into `newParentId`. Rejects no-op moves,
 * a node into itself, and a folder into its own descendant.
 */
export function movableIds(
  ids: string[],
  newParentId: string | null,
  nodes: TreeNodeRecord[],
): string[] {
  const byParent = childrenByParent(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return ids.filter((id) => {
    const node = byId.get(id);
    if (!node) return false;
    if (node.parentId === newParentId) return false; // already there
    if (id === newParentId) return false; // into self
    if (newParentId && collectDescendants(id, byParent).includes(newParentId)) {
      return false; // into own descendant
    }
    return true;
  });
}

/** `ids` plus every descendant, deduped — the full cascade-delete set. */
export function withDescendants(
  ids: string[],
  nodes: TreeNodeRecord[],
): string[] {
  const byParent = childrenByParent(nodes);
  const out = new Set<string>();
  for (const id of ids) {
    out.add(id);
    for (const d of collectDescendants(id, byParent)) out.add(d);
  }
  return [...out];
}

/** Next free position among the children of `parentId`. */
export function nextPosition(
  parentId: string | null,
  nodes: TreeNodeRecord[],
): number {
  const max = nodes.reduce(
    (acc, n) => (n.parentId === parentId ? Math.max(acc, n.position) : acc),
    -1,
  );
  return max + 1;
}
