import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryAdapter } from "../src/lib/tree/memory-adapter";
import type { TreeAdapter } from "../src/lib/tree/types";
import { seedNodes } from "./fixtures/seed";

let adapter: TreeAdapter;

const rows = () => adapter.getSnapshot()!;
const byId = (id: string) => rows().find((n) => n.id === id);

beforeEach(() => {
  adapter = createMemoryAdapter(seedNodes);
});

describe("snapshot stability", () => {
  it("returns the same reference until something changes", () => {
    expect(adapter.getSnapshot()).toBe(adapter.getSnapshot());
  });

  it("returns a new reference after a mutation", async () => {
    const before = adapter.getSnapshot();
    await adapter.create({ kind: "file", parentId: null });
    expect(adapter.getSnapshot()).not.toBe(before);
  });

  it("notifies subscribers on change and stops after unsubscribe", async () => {
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    await adapter.rename("n_readme", "renamed");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await adapter.rename("n_readme", "again");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("create", () => {
  it("appends after the last sibling", async () => {
    const id = await adapter.create({ kind: "file", parentId: "f_tokens" });
    const siblings = rows().filter((n) => n.parentId === "f_tokens");
    const created = byId(id)!;
    expect(created.position).toBe(Math.max(...siblings.map((s) => s.position)));
    expect(
      siblings.filter((s) => s.position === created.position),
    ).toHaveLength(1);
  });

  it("auto-expands the parent so the new node is visible", async () => {
    await adapter.setCollapsed("f_tokens", true);
    await adapter.create({ kind: "file", parentId: "f_tokens" });
    expect(byId("f_tokens")!.collapsed).toBe(false);
  });

  it("defaults folders open and files collapsed", async () => {
    const folder = await adapter.create({ kind: "folder", parentId: null });
    const file = await adapter.create({ kind: "file", parentId: null });
    expect(byId(folder)!.collapsed).toBe(false);
    expect(byId(file)!.collapsed).toBe(true);
    expect(byId(folder)!.name).toBe("Folder tanpa judul");
    expect(byId(file)!.name).toBe("Tanpa judul");
  });
});

describe("remove", () => {
  it("cascades to descendants", async () => {
    await adapter.remove(["f_design"]);
    for (const id of ["f_design", "f_tokens", "n_color", "n_spacing"]) {
      expect(byId(id)).toBeUndefined();
    }
    expect(byId("n_readme")).toBeDefined();
  });

  it("is a no-op for an empty list", async () => {
    const before = adapter.getSnapshot();
    await adapter.remove([]);
    expect(adapter.getSnapshot()).toBe(before);
  });
});

describe("move", () => {
  it("re-parents and expands the target", async () => {
    await adapter.setCollapsed("f_eng", true);
    await adapter.move(["n_readme"], "f_eng");
    expect(byId("n_readme")!.parentId).toBe("f_eng");
    expect(byId("f_eng")!.collapsed).toBe(false);
  });

  it("gives moved nodes distinct trailing positions", async () => {
    await adapter.move(["n_readme", "n_scratch"], "f_eng");
    const moved = [byId("n_readme")!.position, byId("n_scratch")!.position];
    expect(new Set(moved).size).toBe(2);
    const others = rows()
      .filter((n) => n.parentId === "f_eng" && !n.id.startsWith("n_read"))
      .map((n) => n.position);
    expect(Math.min(...moved)).toBeGreaterThan(Math.min(...others));
  });

  it("refuses a folder into its own descendant", async () => {
    await adapter.move(["f_design"], "f_tokens");
    expect(byId("f_design")!.parentId).toBeNull();
  });

  it("moves a nested node back to the root", async () => {
    await adapter.move(["n_color"], null);
    expect(byId("n_color")!.parentId).toBeNull();
  });
});

describe("reset", () => {
  it("restores the seed", async () => {
    await adapter.remove(["f_design", "f_eng", "n_readme", "n_scratch"]);
    expect(rows()).toHaveLength(0);
    await adapter.reset();
    expect(byId("f_design")).toBeDefined();
  });
});
