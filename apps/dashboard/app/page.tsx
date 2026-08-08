"use client";

import * as React from "react";
import { AppSidebar } from "@repo/ui/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/ui/sidebar";

export default function Page() {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  return (
    // h-dvh, not the default min-h-svh: the pane scrolls internally, so the
    // shell must be exactly viewport-height or the page itself scrolls too.
    <SidebarProvider className="h-dvh">
      <AppSidebar activeId={activeId} onSelectNode={setActiveId} />
      {/* min-w-0, or a long name in the pane pushes the inset past the viewport. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dasbor internal</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">
            {activeId
              ? `Item terpilih: ${activeId}`
              : "Pilih item di bilah sisi."}
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
