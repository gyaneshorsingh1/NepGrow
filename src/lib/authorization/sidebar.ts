import { canAccessModule } from "@/lib/authorization/ability";

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
  icon?: string;
  moduleKey: string;
};

/**
 * Build tenant sidebar from enabled modules ∩ permission keys.
 * Icons are string names so Server Components can pass them to the client shell.
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
      href:
        mod.href ||
        `/app/${mod.key === "dashboard" ? "" : mod.key}`.replace(/\/$/, "") ||
        "/app",
      icon: mod.icon ?? "LayoutDashboard",
      moduleKey: mod.key,
    }));
}
