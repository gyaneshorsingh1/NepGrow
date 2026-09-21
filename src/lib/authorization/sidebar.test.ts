import { describe, expect, it } from "vitest";
import {
  buildSidebarItems,
  buildTenantSidebar,
  type ModuleNavSource,
  type SidebarBuilderContext,
} from "@/lib/authorization/sidebar";

const MODULES: ModuleNavSource[] = [
  { key: "dashboard", name: "Dashboard", href: "/app", sortOrder: 0, icon: "LayoutDashboard" },
  { key: "customers", name: "Customers", href: "/app/customers", sortOrder: 10, icon: "Users" },
  { key: "facilities", name: "Facilities", href: "/app/facilities", sortOrder: 11, icon: "Building2" },
  { key: "courts", name: "Courts", href: "/app/courts", sortOrder: 12, icon: "Grid3x3" },
  { key: "bookings", name: "Bookings", href: "/app/bookings", sortOrder: 13, icon: "Calendar" },
  { key: "memberships", name: "Memberships", href: "/app/memberships", sortOrder: 14, icon: "BadgeCheck" },
  { key: "staff", name: "Staff", href: "/app/staff", sortOrder: 20, icon: "UserCog" },
  { key: "payments", name: "Payments", href: "/app/payments", sortOrder: 30, icon: "Wallet" },
  { key: "accounting", name: "Accounting", href: "/app/accounting", sortOrder: 35, icon: "BookOpen" },
  { key: "reports", name: "Reports", href: "/app/reports", sortOrder: 40, icon: "BarChart3" },
  { key: "settings", name: "Settings", href: "/app/settings", sortOrder: 100, icon: "Settings" },
];

function owner() {
  return {
    isPlatformAdmin: true,
    permissionKeys: ["manage.all"],
    enabledModuleKeys: MODULES.map((m) => m.key),
  };
}

function ctx(overrides: Partial<SidebarBuilderContext> = {}) {
  return {
    isPlatformAdmin: false,
    permissionKeys: [],
    enabledModuleKeys: ["dashboard", "customers"],
    ...overrides,
  };
}

describe("buildSidebarItems", () => {
  it("filters by module entitlement and permission", () => {
    const items = buildSidebarItems(MODULES, [
      "dashboard.view",
      "bookings.view",
    ]);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/app");
    expect(hrefs).toContain("/app/bookings");
    expect(hrefs).not.toContain("/app/customers");
  });
});

describe("buildTenantSidebar", () => {
  it("keeps single-section modules as flat links for a platform admin", () => {
    const items = buildTenantSidebar(MODULES, owner());
    const customers = items.find((i) => i.href === "/app/customers");
    const facilities = items.find((i) => i.href === "/app/facilities");
    const payments = items.find((i) => i.href === "/app/payments");
    expect(customers?.children).toBeUndefined();
    expect(facilities?.children).toBeUndefined();
    expect(payments?.children).toBeUndefined();
  });

  it("nests availability under Bookings", () => {
    const items = buildTenantSidebar(MODULES, owner());
    const bookings = items.find((i) => i.href === "/app/bookings");
    expect(bookings?.children?.map((c) => c.href)).toEqual([
      "/app/bookings",
      "/app/availability",
    ]);
  });

  it("nests Plans under Memberships", () => {
    const items = buildTenantSidebar(MODULES, owner());
    const memberships = items.find((i) => i.href === "/app/memberships");
    expect(memberships?.children?.map((c) => c.href)).toEqual([
      "/app/memberships",
      "/app/membership-plans",
    ]);
  });

  it("nests accounting subroutes under Accounting", () => {
    const items = buildTenantSidebar(MODULES, owner());
    const accounting = items.find((i) => i.href === "/app/accounting");
    expect(accounting?.children?.map((c) => c.href)).toEqual([
      "/app/accounting/transactions",
      "/app/accounting/cashbook",
      "/app/accounting/reports",
    ]);
  });

  it("nests business/website subroutes under Settings", () => {
    const items = buildTenantSidebar(MODULES, owner());
    const settings = items.find((i) => i.href === "/app/settings");
    expect(settings?.children?.map((c) => c.href)).toEqual([
      "/app/settings",
      "/app/business",
      "/app/settings/website",
    ]);
  });

  it("shows both staff surfaces when the user holds users + staff access", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["users.view", "staff.view"],
      enabledModuleKeys: ["dashboard", "staff"],
    });
    const staff = items.find((i) => i.moduleKey === "staff");
    expect(staff?.children?.map((c) => c.href)).toEqual([
      "/app/staff",
      "/app/staff/profiles",
    ]);
    expect(staff?.href).toBe("/app/staff");
  });

  it("shows only Employees when the user lacks staff access", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["users.view"],
      enabledModuleKeys: ["dashboard", "staff"],
    });
    const staff = items.find((i) => i.moduleKey === "staff");
    expect(staff?.children?.map((c) => c.href)).toEqual(["/app/staff"]);
    expect(staff?.href).toBe("/app/staff");
  });

  it("shows only Staff Profiles for a staff-only user and points the parent there", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["staff.view"],
      enabledModuleKeys: ["dashboard", "staff"],
    });
    const staff = items.find((i) => i.moduleKey === "staff");
    expect(staff?.children?.map((c) => c.href)).toEqual([
      "/app/staff/profiles",
    ]);
    expect(staff?.href).toBe("/app/staff/profiles");
  });

  it("hides Staff entirely when neither users nor staff access is held", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["payments.view"],
      enabledModuleKeys: ["dashboard", "payments", "staff"],
    });
    expect(items.some((i) => i.moduleKey === "staff")).toBe(false);
  });

  it("adds Roles when the user can manage roles", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["roles.view"],
    });
    expect(items.some((i) => i.href === "/app/roles")).toBe(true);
  });

  it("omits Roles without roles access", () => {
    const items = buildTenantSidebar(MODULES, {
      ...ctx(),
      permissionKeys: ["bookings.view"],
      enabledModuleKeys: ["dashboard", "bookings"],
    });
    expect(items.some((i) => i.href === "/app/roles")).toBe(false);
  });
});