"use client";

import { FilePlus, FolderPlus, Pencil } from "lucide-react";
import { ContextMenuItem, ContextMenuSeparator } from "../ui/context-menu";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

/** Folder row menu: creates land inside the folder. */
export function FolderMenuItems({ node }: { node: TreeNode }) {
  const { create, setRenamingId } = useTreeUI();
  return (
    <>
      <ContextMenuItem onSelect={() => create("file", node.id)}>
        <FilePlus className="size-4" /> Berkas baru
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => create("folder", node.id)}>
        <FolderPlus className="size-4" /> Folder baru
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => setRenamingId(node.id)}>
        <Pencil className="size-4" /> Ubah nama
      </ContextMenuItem>
      <ContextMenuSeparator />
    </>
  );
}

/** Empty-area menu: creates land at the root. */
export function RootMenuItems() {
  const { create } = useTreeUI();
  return (
    <>
      <ContextMenuItem onSelect={() => create("file", null)}>
        <FilePlus className="size-4" /> Berkas baru
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => create("folder", null)}>
        <FolderPlus className="size-4" /> Folder baru
      </ContextMenuItem>
    </>
  );
}
