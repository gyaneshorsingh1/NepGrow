import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Coins,
  FolderTree,
  Globe,
  Grid3x3,
  Landmark,
  LayoutDashboard,
  Layers,
  Package,
  Receipt,
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
  BookOpen,
  Landmark,
  Receipt,
  BarChart3,
  Settings,
  Building2,
  Grid3x3,
  Calendar,
  Clock,
  BadgeCheck,
  Package,
  Layers,
  ScrollText,
  FolderTree,
  Shield,
  Coins,
  Globe,
};

export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return LayoutDashboard;
  return ICON_MAP[name] ?? LayoutDashboard;
}
