import { LucideIcon } from "lucide-react";

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
