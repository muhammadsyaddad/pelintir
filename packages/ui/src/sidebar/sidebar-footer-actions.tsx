"use client";

/**
 * The footer slot the account/credits panel used to occupy. The settings link
 * and dialog it used to hold were not ported — there is no preference UI.
 */
export function SidebarFooterActions() {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="px-1 text-[11px] text-muted-foreground">
        Dasbor internal
      </span>
    </div>
  );
}
