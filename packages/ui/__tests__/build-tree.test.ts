import { describe, expect, it } from "vitest";

import {
  buildTree,
  buildVisibleOrder,
  collectDescendants,
  childrenByParent,
  movableIds,
  nextPosition,
  withDescendants,
} from "../src/lib/tree/build-tree";
import type { TreeNodeRecord } from "../src/lib/tree/types";

function node(
  id: string,
  parentId: string | null,
  kind: "file" | "folder",
  position: number,
  collapsed = false,
): TreeNodeRecord {
  return {
    id,
    kind,
    name: id,
    parentId,
    position,
    collapsed,
    text: "",
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("buildTree", () => {
  it("nests by parentId and sorts folders before files", () => {
    const tree = buildTree([
      node("a", null, "file", 0),
      node("F", null, "folder", 1),
      node("child", "F", "file", 0),
    ]);
    expect(tree.map((n) => n.id)).toEqual(["F", "a"]);
    expect(tree[0]!.children.map((n) => n.id)).toEqual(["child"]);
  });

  it("orders by position, then name", () => {
    const tree = buildTree([
      node("z", null, "file", 0),
      node("a", null, "file", 1),
      node("m", null, "file", 1),
    ]);
    expect(tree.map((n) => n.id)).toEqual(["z", "a", "m"]);
  });

  it("treats a node whose parent is missing as a root", () => {
    const tree = buildTree([node("orphan", "gone", "file", 0)]);
    expect(tree.map((n) => n.id)).toEqual(["orphan"]);
  });

  it("returns an empty tree while loading", () => {
    expect(buildTree(undefined)).toEqual([]);
  });
});

describe("buildVisibleOrder", () => {
  const nodes = [
    node("F", null, "folder", 0),
    node("f1", "F", "file", 0),
    node("f2", "F", "file", 1),
    node("root", null, "file", 1),
  ];

  it("includes children of an open folder", () => {
    expect(buildVisibleOrder(buildTree(nodes), null)).toEqual([
      "F",
      "f1",
      "f2",
      "root",
    ]);
  });

  it("skips children of a collapsed folder", () => {
    const collapsed = [node("F", null, "folder", 0, true), ...nodes.slice(1)];
    expect(buildVisibleOrder(buildTree(collapsed), null)).toEqual([
      "F",
      "root",
    ]);
  });

  it("force-opens collapsed folders while filtering", () => {
    const collapsed = [node("F", null, "folder", 0, true), ...nodes.slice(1)];
    const visible = new Set(["F", "f2"]);
    expect(buildVisibleOrder(buildTree(collapsed), visible)).toEqual([
      "F",
      "f2",
    ]);
  });
});

describe("relations", () => {
  const nodes = [
    node("F", null, "folder", 0),
    node("G", "F", "folder", 0),
    node("deep", "G", "file", 0),
    node("other", null, "file", 1),
  ];

  it("collects descendants transitively", () => {
    const found = collectDescendants("F", childrenByParent(nodes)).sort();
    expect(found).toEqual(["G", "deep"]);
  });

  it("cascades a delete over the whole subtree", () => {
    expect(withDescendants(["F"], nodes).sort()).toEqual(["F", "G", "deep"]);
  });

  it("dedupes overlapping delete targets", () => {
    expect(withDescendants(["F", "G"], nodes).sort()).toEqual([
      "F",
      "G",
      "deep",
    ]);
  });

  it("appends after the highest sibling position", () => {
    expect(nextPosition(null, nodes)).toBe(2);
    expect(nextPosition("F", nodes)).toBe(1);
    expect(nextPosition("missing", nodes)).toBe(0);
  });
});

describe("movableIds", () => {
  const nodes = [
    node("F", null, "folder", 0),
    node("G", "F", "folder", 0),
    node("deep", "G", "file", 0),
    node("other", null, "file", 1),
  ];

  it("refuses a folder into its own descendant", () => {
    expect(movableIds(["F"], "G", nodes)).toEqual([]);
    expect(movableIds(["F"], "deep", nodes)).toEqual([]);
  });

  it("refuses a node into itself", () => {
    expect(movableIds(["F"], "F", nodes)).toEqual([]);
  });

  it("refuses a no-op move", () => {
    expect(movableIds(["G"], "F", nodes)).toEqual([]);
  });

  it("drops unknown ids but keeps legal ones", () => {
    expect(movableIds(["ghost", "other"], "F", nodes)).toEqual(["other"]);
  });

  it("allows moving a subtree up to the root", () => {
    expect(movableIds(["G"], null, nodes)).toEqual(["G"]);
  });
});
