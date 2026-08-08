"use client";

import { FilePlus, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { ContextMenuItem, ContextMenuSeparator } from "../ui/context-menu";

import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

/** Reads "Hapus 3 item" when the right-clicked row is part of a selection. */
function DeleteMenuItem({ node }: { node: TreeNode }) {
  const { selection } = useTreeUI();
  const multi =
    selection.selectedIds.size > 1 && selection.selectedIds.has(node.id);
  return (
    <ContextMenuItem
      variant="destructive"
      onSelect={() => selection.deleteSelectionOr(node.id)}
    >
      <Trash2 className="size-4" />
      {multi ? `Hapus ${selection.selectedIds.size} item` : "Hapus"}
    </ContextMenuItem>
  );
}

/** File row menu: creates land beside the file, in its parent. */
export function FileMenuItems({ node }: { node: TreeNode }) {
  const { create, setRenamingId } = useTreeUI();
  return (
    <>
      <ContextMenuItem onSelect={() => setRenamingId(node.id)}>
        <Pencil className="size-4" /> Ubah nama
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => create("file", node.parentId)}>
        <FilePlus className="size-4" /> Berkas baru di sini
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => create("folder", node.parentId)}>
        <FolderPlus className="size-4" /> Folder baru di sini
      </ContextMenuItem>
      <ContextMenuSeparator />
      <DeleteMenuItem node={node} />
    </>
  );
}

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
      <DeleteMenuItem node={node} />
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
