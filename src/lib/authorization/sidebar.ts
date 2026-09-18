import type { LucideIcon } from "lucide-react";
import { canAccessModule } from "@/lib/authorization/ability";
import { resolveIcon } from "@/lib/icons";

export type ModuleNavSource = {
  key: string;
  name: string;
  href?: string | null;
  icon?: string | null;
  sortOrder?: number;
};

export type SidebarItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  moduleKey: string;
};

/**
 * Build tenant sidebar from enabled modules ∩ permission keys.
 */
export function buildSidebarItems(
  enabledModules: ModuleNavSource[],
  permissionKeys: string[],
): SidebarItem[] {
  const enabledKeys = enabledModules.map((m) => m.key);

  return enabledModules
    .filter((mod) => canAccessModule(enabledKeys, permissionKeys, mod.key))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((mod) => ({
      title: mod.name,
      href: mod.href || `/app/${mod.key === "dashboard" ? "" : mod.key}`.replace(/\/$/, "") || "/app",
      icon: resolveIcon(mod.icon),
      moduleKey: mod.key,
    }));
}
