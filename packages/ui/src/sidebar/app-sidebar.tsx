"use client";

import * as React from "react";
import { ContextMenu, ContextMenuContent } from "../ui/context-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "../ui/sidebar";
import { RootMenuItems } from "./node-context-menu";
import { SidebarFooterActions } from "./sidebar-footer-actions";
import { SidebarSearch } from "./sidebar-search";
import { SidebarMenu } from "../ui/sidebar";
import { SidebarMenuItem, SidebarMenuButton } from "../ui/sidebar";
import { TreeItemList } from "./tree-item";
import { TreeUIProvider, type TreeUI } from "./tree-ui-context";
import { useTreeAdapter } from "./tree-provider";
import { useMotionConfig } from "../hooks/use-motion-config";
import { useTree } from "../hooks/use-tree";
import { useTreeDnd } from "../hooks/use-tree-dnd";
import { useTreeSelection } from "../hooks/use-tree-selection";
import { buildVisibleOrder } from "../lib/tree/build-tree";
import { filterNodes } from "../lib/tree/filter";
import type { NodeKind } from "../lib/tree/types";
import { navigationData } from "../lib/constant";

// `onSelect` is deliberately not the prop name: it collides with the DOM
// handler that ComponentProps<typeof Sidebar> already carries.
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeId: string | null;
  onSelectNode: (id: string) => void;
};

export function AppSidebar({
  activeId,
  onSelectNode: onSelect,
  ...props
}: AppSidebarProps) {
  const adapter = useTreeAdapter();
  const { nodes, tree, loading } = useTree();
  const motion = useMotionConfig();

  const [query, setQuery] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const filter = React.useMemo(
    () => (nodes ? filterNodes(nodes, query) : null),
    [nodes, query],
  );
  const filteredNav = React.useMemo(() => {
    if (!query) return navigationData;
    return navigationData
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase()),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const filterVisible = filter?.visible ?? null;
  const visibleOrder = React.useMemo(
    () => buildVisibleOrder(tree, filterVisible),
    [tree, filterVisible],
  );

  const selection = useTreeSelection(nodes, visibleOrder);
  const dnd = useTreeDnd(selection);

  const create = React.useCallback(
    (kind: NodeKind, parentId: string | null) => {
      void adapter.create({ kind, parentId }).then((id) => {
        // A brand-new node is always born nameless — go straight to renaming.
        setRenamingId(id);
        if (kind === "file") onSelect(id);
      });
    },
    [adapter, onSelect],
  );

  const ui = React.useMemo<TreeUI>(
    () => ({
      activeId,
      onSelect,
      renamingId,
      setRenamingId,
      commitRename: (id, name) => {
        setRenamingId(null);
        void adapter.rename(id, name);
      },
      create,
      setCollapsed: (id, collapsed) => void adapter.setCollapsed(id, collapsed),
      filterVisible,
      selection,
      dnd,
      motion,
    }),
    [
      activeId,
      adapter,
      create,
      dnd,
      filterVisible,
      motion,
      onSelect,
      renamingId,
      selection,
    ],
  );

  const isEmpty = !loading && tree.length === 0;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-[9.5px]">
        <div className="flex items-center gap-1.5">
          <SidebarSearch value={query} onChange={setQuery} />
        </div>
      </SidebarHeader>

      <TreeUIProvider value={ui}>
        {/* Right-click on empty space creates at the root; so does a drop. */}
        <ContextMenu>
          <SidebarContent className="px-1.5 py-2">
            {filteredNav.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                Tidak ada hasil untuk “{query}”.
              </p>
            ) : (
              filteredNav.map((group) => (
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
                              onClick={() => onSelect(item.id)}
                              className="h-8 gap-2 rounded-md px-2 text-xs font-normal"
                            >
                              <Icon className="size-4 shrink-0 opacity-70" />
                              <span className="truncate">{item.name}</span>
                            </SidebarMenuButton>

                            {/*<TreeItemList nodes={tree} level={0} />*/}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))
            )}
          </SidebarContent>
          <ContextMenuContent className="w-52">
            <RootMenuItems />
          </ContextMenuContent>
        </ContextMenu>
      </TreeUIProvider>

      <SidebarFooter className="p-2">
        <SidebarFooterActions />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
