"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { cn } from "../lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { SidebarMenuButton } from "../ui/sidebar";

import { FileMenuItems } from "./node-context-menu";
import { RenameInput } from "./rename-input";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

export function FileLeaf({ node, level }: { node: TreeNode; level: number }) {
  const {
    activeId,
    onSelect,
    renamingId,
    setRenamingId,
    commitRename,
    selection,
    dnd,
    motion: motionConfig,
  } = useTreeUI();

  const isActive = node.id === activeId;
  const isSelected = selection.selectedIds.has(node.id);
  const isRenaming = node.id === renamingId;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {/* SidebarMenuItem's markup, inlined so Framer can own the element. */}
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
          <SidebarMenuButton
            isActive={isActive}
            draggable={!isRenaming}
            onDragStart={(e) => dnd.onDragStart(node.id, e)}
            onDragEnd={dnd.onDragEnd}
            onClick={(e) => {
              selection.onItemClick(node.id, e);
              // Modifier click is selection only; a plain click also opens.
              if (!e.shiftKey && !e.metaKey && !e.ctrlKey) onSelect(node.id);
            }}
            onContextMenu={() => selection.ensureSelected(node.id)}
            onKeyDown={(e) => {
              if (e.key === "F2") {
                e.preventDefault();
                setRenamingId(node.id);
              }
            }}
            className={cn(
              "h-7 gap-1.5 rounded-none px-2 text-xs font-normal",
              (isActive || isSelected) && "font-medium",
              isSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <FileText className="size-3.5 shrink-0 opacity-60" />
            {isRenaming ? (
              <RenameInput
                initial={node.name}
                onCommit={(v) => commitRename(node.id, v || "Tanpa judul")}
                onCancel={() => setRenamingId(null)}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </SidebarMenuButton>
        </motion.li>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <FileMenuItems node={node} />
      </ContextMenuContent>
    </ContextMenu>
  );
}
