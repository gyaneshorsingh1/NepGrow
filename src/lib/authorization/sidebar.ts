import {
  canAccessModule,
  isModuleExempt,
} from "@/lib/authorization/ability";

export type ModuleNavSource = {
  key: string;
  name: string;
  href?: string | null;
  icon?: string | null;
  sortOrder?: number;
};

export type SidebarChild = {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
};

export type SidebarItem = {
  title: string;
  href: string;
  icon?: string;
  moduleKey: string;
  disabled?: boolean;
  children?: SidebarChild[];
};

export type SidebarBuilderContext = {
  isPlatformAdmin: boolean;
  permissionKeys: string[];
  enabledModuleKeys: string[];
};

type ChildSpec = {
  title: string;
  href: string;
  icon?: string;
  /** Module that must be enabled before this child is shown (ignored for exempt modules). */
  moduleKey?: string;
  /** Any of these permission keys grants access to the child. */
  permissionKeys?: string[];
};

/**
 * Sub-navigation for modules that contain multiple logical sections.
 * Children inherit the parent module's entitlement by default; extra gates are
 * applied per child when one module spans several permission surfaces.
 */
const MODULE_CHILDREN: Record<string, ChildSpec[]> = {
  accounting: [
    {
      title: "Transaction History",
      href: "/app/accounting/transactions",
      icon: "Receipt",
    },
    {
      title: "Cashbook Accounts",
      href: "/app/accounting/cashbook",
      icon: "Landmark",
    },
    {
      title: "Accounting Report",
      href: "/app/accounting/reports",
      icon: "BookOpen",
    },
  ],
  bookings: [
    { title: "All Bookings", href: "/app/bookings", icon: "Calendar" },
    { title: "Availability", href: "/app/availability", icon: "Clock" },
  ],
  memberships: [
    {
      title: "Customer Memberships",
      href: "/app/memberships",
      icon: "BadgeCheck",
    },
    { title: "Plans", href: "/app/membership-plans", icon: "Package" },
  ],
  settings: [
    { title: "General", href: "/app/settings", icon: "Settings" },
    { title: "Business Profile", href: "/app/business", icon: "Building2" },
    { title: "Website Content", href: "/app/settings/website", icon: "Globe" },
  ],
  staff: [
    {
      title: "Employees",
      href: "/app/staff",
      icon: "Users",
      permissionKeys: ["users.view", "users.manage", "manage.all"],
    },
    {
      title: "Staff Profiles",
      href: "/app/staff/profiles",
      icon: "UserCog",
      moduleKey: "staff",
      permissionKeys: ["staff.view", "staff.manage", "manage.all"],
    },
  ],
};

function childAccessible(spec: ChildSpec, ctx: SidebarBuilderContext): boolean {
  if (ctx.isPlatformAdmin) return true;
  if (
    spec.moduleKey &&
    !isModuleExempt(spec.moduleKey) &&
    !ctx.enabledModuleKeys.includes(spec.moduleKey)
  ) {
    return false;
  }
  if (
    spec.permissionKeys?.length &&
    !spec.permissionKeys.some((key) => ctx.permissionKeys.includes(key))
  ) {
    return false;
  }
  return true;
}

function toSidebarChild(spec: ChildSpec): SidebarChild {
  return { title: spec.title, href: spec.href, icon: spec.icon };
}

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

/**
 * Staff is special: it surfaces two permission surfaces ("users" and "staff")
 * that can each exist without the other, so the parent is derived from its
 * children rather than the staff module entitlement alone.
 */
function buildStaffItem(ctx: SidebarBuilderContext): SidebarItem | null {
  const children = (MODULE_CHILDREN.staff ?? [])
    .filter((spec) => childAccessible(spec, ctx))
    .map(toSidebarChild);
  if (!children.length) return null;
  const employeesVisible = children.some((c) => c.href === "/app/staff");
  return {
    title: "Staff",
    href: employeesVisible ? "/app/staff" : children[0].href,
    icon: "UserCog",
    moduleKey: "staff",
    children,
  };
}

/**
 * Full tenant navigation: module items enriched with permission-aware children.
 * Modules with a single logical section stay as flat links; modules with
 * multiple sections (accounting, bookings, memberships, settings, staff)
 * render as expandable parents.
 */
export function buildTenantSidebar(
  enabledModules: ModuleNavSource[],
  ctx: SidebarBuilderContext,
): SidebarItem[] {
  const items = buildSidebarItems(enabledModules, ctx.permissionKeys);

  const staffItem = buildStaffItem(ctx);
  const staffIdx = items.findIndex((i) => i.moduleKey === "staff");
  if (staffItem) {
    if (staffIdx >= 0) {
      items.splice(staffIdx, 1, staffItem);
    } else {
      items.push(staffItem);
    }
  } else if (staffIdx >= 0) {
    items.splice(staffIdx, 1);
  }

  const canManageRoles =
    ctx.isPlatformAdmin ||
    ["manage.all", "roles.view", "roles.manage"].some((key) =>
      ctx.permissionKeys.includes(key),
    );
  if (canManageRoles && !items.some((i) => i.href === "/app/roles")) {
    items.push({
      title: "Roles",
      href: "/app/roles",
      icon: "Shield",
      moduleKey: "roles",
    });
  }

  for (const item of items) {
    const specs = MODULE_CHILDREN[item.moduleKey];
    if (!specs?.length) continue;
    if (item.moduleKey === "staff") continue;
    item.children = specs.map(toSidebarChild);
  }

  return items;
}