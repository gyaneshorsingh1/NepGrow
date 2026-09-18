import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  Building2,
  Calendar,
  FolderTree,
  Grid3x3,
  LayoutDashboard,
  Layers,
  Package,
  ScrollText,
  Settings,
  Shield,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserCog,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  Grid3x3,
  Calendar,
  BadgeCheck,
  Package,
  Layers,
  ScrollText,
  FolderTree,
  Shield,
};

export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return LayoutDashboard;
  return ICON_MAP[name] ?? LayoutDashboard;
}
