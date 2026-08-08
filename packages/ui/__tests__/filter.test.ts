import { describe, expect, it } from "vitest";

import { filterNodes } from "../src/lib/tree/filter";
import type { TreeNodeRecord } from "../src/lib/tree/types";

const nodes: TreeNodeRecord[] = [
  {
    id: "F",
    kind: "folder",
    name: "Design",
    parentId: null,
    position: 0,
    collapsed: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "G",
    kind: "folder",
    name: "Tokens",
    parentId: "F",
    position: 0,
    collapsed: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "n1",
    kind: "file",
    name: "color.md",
    parentId: "G",
    position: 0,
    collapsed: true,
    text: "contrast ratios",
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "n2",
    kind: "file",
    name: "notes.md",
    parentId: null,
    position: 1,
    collapsed: true,
    createdAt: 0,
    updatedAt: 0,
  },
];

describe("filterNodes", () => {
  it("returns null for an empty query", () => {
    expect(filterNodes(nodes, "   ")).toBeNull();
  });

  it("matches a name and pulls in every ancestor", () => {
    const result = filterNodes(nodes, "color")!;
    expect([...result.visible].sort()).toEqual(["F", "G", "n1"]);
    expect(result.hits.get("n1")!.reason).toBe("name");
    expect(result.hits.get("F")!.reason).toBe("ancestor");
  });

  it("matches file body text", () => {
    const result = filterNodes(nodes, "contrast")!;
    expect(result.hits.get("n1")!.reason).toBe("content");
  });

  it("ignores body text on folders", () => {
    const withFolderText = nodes.map((n) =>
      n.id === "G" ? { ...n, text: "contrast" } : n,
    );
    const result = filterNodes(withFolderText, "contrast")!;
    expect(result.hits.get("G")!.reason).toBe("ancestor");
  });

  it("tolerates a node with no text field", () => {
    expect(filterNodes(nodes, "notes")!.visible.has("n2")).toBe(true);
  });

  it("returns an empty set when nothing matches", () => {
    expect(filterNodes(nodes, "zzz")!.visible.size).toBe(0);
  });
});
