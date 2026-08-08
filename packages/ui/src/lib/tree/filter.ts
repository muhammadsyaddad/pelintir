import type { NodeKind, TreeNodeRecord } from "./types";

export type SearchHit = {
  id: string;
  name: string;
  parentId: string | null;
  kind: NodeKind;
  /** Reason the node matches: its name, its body, or it's on a match's path. */
  reason: "name" | "content" | "ancestor";
};

/**
 * Filter nodes by query. Returns the ids to display:
 * - every node whose name or `text` matches
 * - plus their ancestor folders, so the tree path still renders
 *
 * `null` means "no active query" — render the tree normally.
 */
export function filterNodes(
  nodes: TreeNodeRecord[],
  query: string,
): { visible: Set<string>; hits: Map<string, SearchHit> } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visible = new Set<string>();
  const hits = new Map<string, SearchHit>();

  for (const n of nodes) {
    const nameMatch = n.name.toLowerCase().includes(q);
    const contentMatch =
      n.kind === "file" && (n.text ?? "").toLowerCase().includes(q);
    if (!nameMatch && !contentMatch) continue;

    visible.add(n.id);
    hits.set(n.id, {
      id: n.id,
      name: n.name,
      parentId: n.parentId,
      kind: n.kind,
      reason: nameMatch ? "name" : "content",
    });

    let cursor = n.parentId;
    while (cursor && byId.has(cursor)) {
      const parent = byId.get(cursor)!;
      if (!visible.has(cursor)) {
        visible.add(cursor);
        hits.set(cursor, {
          id: cursor,
          name: parent.name,
          parentId: parent.parentId,
          kind: "folder",
          reason: "ancestor",
        });
      }
      cursor = parent.parentId;
    }
  }
  return { visible, hits };
}
