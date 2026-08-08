"use client";

import { Search, X } from "lucide-react";
import { Input } from "../ui/input";

export function SidebarSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari…"
        aria-label="Cari berkas"
        className="h-7 bg-sidebar-accent/60 pr-7 pl-7 text-xs shadow-none focus-visible:ring-1"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Hapus pencarian"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
