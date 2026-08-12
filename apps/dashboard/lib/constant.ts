import {
  LucideIcon,
  FileText,
  Home,
  Settings,
  Folder,
  User,
  Shield,
} from "lucide-react";

export interface NavSubPage {
  id: string;
  name: string;
  icon?: LucideIcon;
  href?: string;
  path?: string;
}

export interface NavGroup {
  id: string;
  title?: string;
  items: NavSubPage[];
}

export const navigationData: NavGroup[] = [
  {
    // UNGROUPED: Langsung muncul di bagian atas tanpa label grup
    id: "main-ungrouped",
    items: [
      {
        id: "dashboard",
        name: "Beranda Utama",
        icon: Home,
        path: "/",
      },
      {
        id: "overview",
        name: "Ikhtisar Proyek",
        icon: FileText,
        path: "overview",
      },
    ],
  },
  // {
  //   // GROUPED: Memiliki Header Label "Manajemen Berkas"
  //   id: "group-files",
  //   title: "Manajemen Berkas",
  //   items: [
  //     {
  //       id: "documents",
  //       name: "Dokumen Saya",
  //       icon: Folder,
  //       path: "document",
  //     },
  //     { id: "archived", name: "Arsip", icon: FileText, path: "archived" },
  //   ],
  // },
  // {
  //   // GROUPED: Memiliki Header Label "Pengaturan"
  //   id: "group-settings",
  //   title: "Pengaturan & Akun",
  //   items: [
  //     { id: "profile", name: "Profil Pengguna", icon: User, path: "profile" },
  //     { id: "security", name: "Keamanan", icon: Shield, path: "security" },
  //     {
  //       id: "general-settings",
  //       name: "Pengaturan Umum",
  //       icon: Settings,
  //       path: "settings",
  //     },
  //   ],
  // },
];
