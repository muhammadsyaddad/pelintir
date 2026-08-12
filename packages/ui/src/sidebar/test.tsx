"use client";

import { AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import {
  SidebarMenu,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";

import { FileLeaf } from "./file-leaf";
import { FolderItem } from "./folder-item";
import { useTreeUI } from "./tree-ui-context";
import type { TreeNode } from "../lib/tree/types";

export interface NavSubPage {
  id: string;
  name: string;
  icon?: any;
}

/** Dispatcher. Filtered-out nodes render nothing at all. */
export function TreeItem({ node, level }: { node: TreeNode; level: number }) {
  const { filterVisible } = useTreeUI();
  if (filterVisible && !filterVisible.has(node.id)) return null;

  return node.kind === "file" ? (
    <FileLeaf node={node} level={level} />
  ) : (
    <FolderItem node={node} level={level} />
  );
}

/**
 * One list of siblings. `initial={false}` keeps the first paint still —
 * only rows that appear or vanish afterwards animate.
 */
export function TreeItemList({
  nodes,
  level,
  className,
  // Props baru untuk keperluan filteredNav
  filteredNav,
  query,
  activeId,
  onSelect,
}: {
  nodes: TreeNode[];
  level: number;
  className?: string;
  filteredNav?: string;
  query?: string;
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  if (filteredNav && level === 0) {
    if (filteredNav.length === 0) {
      return (
        <p className="px-2 py-1 text-xs text-muted-foreground">
          Tidak ada hasil untuk “{query}”.
        </p>
      );
    }

    return (
      <>
        {filteredNav.map((group) => (
          <SidebarGroup key={group.id} className="p-0 mb-3">
            {/* Jika group memiliki title, tampilkan sebagai Label Grouped */}
            {group.title && (
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item: NavSubPage) => {
                  const Icon = item.icon || FileText;
                  const isActive = activeId === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onSelect?.(item.id)}
                        className="h-8 gap-2 rounded-md px-2 text-xs font-normal"
                      >
                        <Icon className="size-4 shrink-0 opacity-70" />
                        <span className="truncate">{item.name}</span>
                      </SidebarMenuButton>

                      {/* TreeItemList dipanggil kembali (seperti di struktur asli Anda) tanpa filteredNav untuk merender tree */}
                      <TreeItemList nodes={nodes} level={0} />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </>
    );
  }

  // Render default rekursif khusus untuk node (Folder / File)
  return (
    <SidebarMenu className={className ?? "gap-0"}>
      <AnimatePresence initial={false}>
        {nodes.map((node) => (
          <TreeItem key={node.id} node={node} level={level} />
        ))}
      </AnimatePresence>
    </SidebarMenu>
  );
}
