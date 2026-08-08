"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "../lib/utils";
import { Collapsible, CollapsibleTrigger } from "../ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { SidebarMenuButton } from "../ui/sidebar";

import { FolderMenuItems } from "./node-context-menu";
import { RenameInput } from "./rename-input";
import { TreeItemList } from "./tree-item";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

export function FolderItem({ node, level }: { node: TreeNode; level: number }) {
  const {
    renamingId,
    setRenamingId,
    commitRename,
    setCollapsed,
    filterVisible,
    selection,
    dnd,
    motion: motionConfig,
  } = useTreeUI();

  // A search forces every folder open, so matches deeper down stay reachable.
  // `collapsed` is persisted per node and read straight from the adapter —
  // no local mirror, so there is nothing to keep in sync.
  const isOpen = !!filterVisible || !node.collapsed;

  const isRenaming = node.id === renamingId;
  const isSelected = selection.selectedIds.has(node.id);
  const isDropTarget = dnd.dropTargetId === node.id;

  return (
    <Collapsible open={isOpen} onOpenChange={(o) => setCollapsed(node.id, !o)}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            variants={motionConfig.row}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionConfig.transition}
            whileHover={motionConfig.rowHover}
            className="group/menu-item relative"
          >
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                draggable={!isRenaming}
                onDragStart={(e) => {
                  e.stopPropagation();
                  dnd.onDragStart(node.id, e);
                }}
                onDragEnd={dnd.onDragEnd}
                onDragOver={(e) => dnd.onDragOverFolder(node.id, e)}
                onDragLeave={dnd.onDragLeaveFolder}
                onDrop={(e) => dnd.onDropFolder(node.id, e)}
                onClick={(e) => {
                  // Modifier click selects; it must not also toggle the folder.
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    selection.onItemClick(node.id, e);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(node.id);
                }}
                onContextMenu={() => selection.ensureSelected(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "F2") {
                    e.preventDefault();
                    setRenamingId(node.id);
                  }
                }}
                className={cn(
                  "h-7 gap-1 rounded-none px-2 text-xs font-normal",
                  isSelected &&
                    "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  isDropTarget && "ring-1 ring-sidebar-ring ring-inset",
                )}
                style={{ paddingLeft: `${level * 12 + 4}px` }}
              >
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0 transition-transform duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
                    isOpen && "rotate-90",
                  )}
                />
                {isOpen ? (
                  <FolderOpen className="size-3.5 shrink-0 opacity-70" />
                ) : (
                  <Folder className="size-3.5 shrink-0 opacity-70" />
                )}
                {isRenaming ? (
                  <RenameInput
                    initial={node.name}
                    onCommit={(v) =>
                      commitRename(node.id, v || "Folder tanpa judul")
                    }
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <span className="truncate">{node.name}</span>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </motion.li>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <FolderMenuItems node={node} />
        </ContextMenuContent>
      </ContextMenu>

      {/*
        Radix's CollapsibleContent animates nothing on its own, so the body is
        driven directly: height 0 <-> auto with overflow hidden. This is the
        most visible difference between the motion presets.
      */}
      <AnimatePresence initial={false}>
        {isOpen && node.children.length > 0 && (
          <motion.div
            key="children"
            variants={motionConfig.collapse}
            initial="closed"
            animate="open"
            exit="closed"
            transition={motionConfig.transition}
            className="overflow-hidden"
          >
            <TreeItemList nodes={node.children} level={level + 1} />
          </motion.div>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}
