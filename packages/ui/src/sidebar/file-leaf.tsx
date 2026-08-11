"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { ContextMenu, ContextMenuTrigger } from "../ui/context-menu";
import { SidebarMenuButton } from "../ui/sidebar";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

export function FileLeaf({ node, level }: { node: TreeNode; level: number }) {
  const { activeId, selection, motion: motionConfig } = useTreeUI();

  const isActive = node.id === activeId;
  const isSelected = selection.selectedIds.has(node.id);

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
            className={cn(
              "h-7 gap-1.5 rounded-none px-2 text-xs font-normal",
              (isActive || isSelected) && "font-medium",
              isSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <FileText className="size-3.5 shrink-0 opacity-60" />
          </SidebarMenuButton>
        </motion.li>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}
