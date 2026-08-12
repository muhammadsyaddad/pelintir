"use client";

import * as React from "react";
import { AppSidebar } from "@repo/ui/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/ui/sidebar";
import { navigationData } from "@/lib/constant";

// 1. Buat Context agar page bisa tahu item mana yang aktif
export const SidebarContext = React.createContext<{
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}>({
  activeId: null,
  setActiveId: () => {},
});

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ activeId, setActiveId }}>
      <SidebarProvider className="h-dvh">
        <AppSidebar
          activeId={activeId}
          onSelectNode={setActiveId}
          navigationData={navigationData}
        />

        <SidebarInset className="min-w-0">
          <header className="flex h-12 shrink-0 items-center gap-2 px-3">
            <SidebarTrigger />
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            {/* children di sini adalah page.tsx kita nantinya */}
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarContext.Provider>
  );
}
