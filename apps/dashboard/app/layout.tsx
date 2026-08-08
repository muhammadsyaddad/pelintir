import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { SidebarProviders } from "@repo/ui/sidebar/providers";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pelintir — Dasbor Internal",
  description:
    "Alat internal: koreksi normalisasi, penggabungan alias penyedia, triase laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body>
        <SidebarProviders>{children}</SidebarProviders>
      </body>
    </html>
  );
}
