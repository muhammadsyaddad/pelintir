import {
  LucideIcon,
  FileText,
  Home,
  Settings,
  Folder,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";

export interface NavSubPage {
  id: string;
  name: string;
  icon?: LucideIcon;
  href?: string;
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
