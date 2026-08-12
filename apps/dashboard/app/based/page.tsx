import { Archive } from "lucide-react";

export default function BasedPage() {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
      <Archive className="size-16 mb-4 opacity-50" />
      <h1 className="text-2xl font-bold text-foreground">
        Halaman Arsip (Archived)
      </h1>
      <p className="mt-2 text-sm">
        Semua file atau catatan yang telah Anda arsipkan akan muncul di halaman
        ini.
      </p>
    </div>
  );
}
