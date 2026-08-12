("use client");

import * as React from "react";
import {
  FileText,
  Home,
  Settings,
  Folder,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";
import { SidebarFooterActions } from "./sidebar-footer-actions";
import { SidebarSearch } from "./sidebar-search";
import type { NavGroup, NavSubPage } from "./navigation-types";

// Contoh Data Navigasi Static (Ada Group dan Ungroup)
const navigationData: NavGroup[] = [
  {
    // UNGROUPED: Langsung muncul di bagian atas tanpa label grup
    id: "main-ungrouped",
    items: [
      { id: "dashboard", name: "Beranda Utama", icon: Home },
      { id: "overview", name: "Ikhtisar Proyek", icon: FileText },
    ],
  },
  {
    // GROUPED: Memiliki Header Label "Manajemen Berkas"
    id: "group-files",
    title: "Manajemen Berkas",
    items: [
      { id: "documents", name: "Dokumen Saya", icon: Folder },
      { id: "archived", name: "Arsip", icon: FileText },
    ],
  },
  {
    // GROUPED: Memiliki Header Label "Pengaturan"
    id: "group-settings",
    title: "Pengaturan & Akun",
    items: [
      { id: "profile", name: "Profil Pengguna", icon: User },
      { id: "security", name: "Keamanan", icon: Shield },
      { id: "general-settings", name: "Pengaturan Umum", icon: Settings },
      { id: "help", name: "Pusat Bantuan", icon: HelpCircle },
    ],
  },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeId: string | null;
  onSelectNode: (id: string) => void;
};

export function AppSidebar({
  activeId,
  onSelectNode: onSelect,
  ...props
}: AppSidebarProps) {
  const [query, setQuery] = React.useState("");

  // Filter pencarian sederhana untuk subpage
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-[9.5px]">
        <div className="flex items-center gap-1.5">
          <SidebarSearch value={query} onChange={setQuery} />
        </div>
      </SidebarHeader>

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
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarFooterActions />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
