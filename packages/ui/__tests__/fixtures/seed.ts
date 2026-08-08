import type { TreeNodeRecord } from "../../src/lib/tree/types";

type SeedSpec = {
  id: string;
  kind: "file" | "folder";
  name: string;
  parentId: string | null;
  text?: string;
};

/**
 * Fixed ids on purpose: a showcase should look identical on every machine,
 * and stable ids make the Dexie reseed idempotent.
 */
const SPEC: SeedSpec[] = [
  { id: "f_design", kind: "folder", name: "Design", parentId: null },
  { id: "f_tokens", kind: "folder", name: "Tokens", parentId: "f_design" },
  {
    id: "n_color",
    kind: "file",
    name: "color.md",
    parentId: "f_tokens",
    text: "Palette tokens, contrast ratios, dark-mode ramp.",
  },
  {
    id: "n_spacing",
    kind: "file",
    name: "spacing.md",
    parentId: "f_tokens",
    text: "Four-point spacing scale and layout rhythm.",
  },
  {
    id: "n_motion",
    kind: "file",
    name: "motion.md",
    parentId: "f_design",
    text: "Duration and easing presets, reduced-motion policy.",
  },
  { id: "f_eng", kind: "folder", name: "Engineering", parentId: null },
  { id: "f_rfc", kind: "folder", name: "RFCs", parentId: "f_eng" },
  {
    id: "n_rfc1",
    kind: "file",
    name: "001-tree-adapter.md",
    parentId: "f_rfc",
    text: "One seam between the sidebar and its data source.",
  },
  {
    id: "n_rfc2",
    kind: "file",
    name: "002-offline-first.md",
    parentId: "f_rfc",
    text: "IndexedDB as the source of truth, sync as an afterthought.",
  },
  {
    id: "n_setup",
    kind: "file",
    name: "setup.md",
    parentId: "f_eng",
    text: "Clone, bun install, bun run dev. That is the whole thing.",
  },
  {
    id: "n_readme",
    kind: "file",
    name: "README.md",
    parentId: null,
    text: "Drag rows into folders. Shift-click a range. Right-click anywhere.",
  },
  {
    id: "n_scratch",
    kind: "file",
    name: "scratch.md",
    parentId: null,
    text: "Nothing important lives here.",
  },
];

/** A fresh copy of the demo tree. Never hand out the same array twice. */
export function seedNodes(): TreeNodeRecord[] {
  const now = Date.now();
  const seen = new Map<string | null, number>();
  return SPEC.map((s) => {
    const position = seen.get(s.parentId) ?? 0;
    seen.set(s.parentId, position + 1);
    return {
      id: s.id,
      kind: s.kind,
      name: s.name,
      parentId: s.parentId,
      position,
      collapsed: s.kind === "folder" ? false : true,
      text: s.text ?? "",
      createdAt: now,
      updatedAt: now,
    };
  });
}
