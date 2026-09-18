import { redirect } from "next/navigation";
import Link from "next/link";

import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getSession } from "@/lib/auth/session";
import { resolveTenantContext } from "@/lib/authorization/context";
import { buildSidebarItems } from "@/lib/authorization/sidebar";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/app/login");
  }

  // Super Admin surface is /admin — tenant app is for business members only
  if (session.user.isPlatformAdmin) {
    redirect("/admin");
  }

  let ctx;
  try {
    ctx = await resolveTenantContext();
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
        redirect("/app/login");
      }
    }
    throw error;
  }

  const modules = await prisma.module.findMany({
    where: {
      OR: [
        { key: { in: ctx.enabledModuleKeys } },
        { key: { in: ["dashboard", "settings"] } },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  const navItems = buildSidebarItems(modules, ctx.permissionKeys);

  const canManageRoles =
    ctx.isPlatformAdmin ||
    ctx.permissionKeys.includes("manage.all") ||
    ctx.permissionKeys.includes("roles.view") ||
    ctx.permissionKeys.includes("roles.manage");

  if (canManageRoles && !navItems.some((i) => i.href === "/app/roles")) {
    navItems.push({
      title: "Roles",
      href: "/app/roles",
      icon: "Shield",
      moduleKey: "roles",
    });
  }

  // Availability is part of bookings entitlement (no separate module catalog entry yet)
  if (
    ctx.enabledModuleKeys.includes("bookings") &&
    (ctx.permissionKeys.includes("bookings.view") ||
      ctx.permissionKeys.includes("bookings.manage") ||
      ctx.permissionKeys.includes("manage.all")) &&
    !navItems.some((i) => i.href === "/app/availability")
  ) {
    const bookingsIdx = navItems.findIndex((i) => i.href === "/app/bookings");
    const item = {
      title: "Availability",
      href: "/app/availability",
      icon: "Calendar",
      moduleKey: "bookings",
    };
    if (bookingsIdx >= 0) navItems.splice(bookingsIdx, 0, item);
    else navItems.push(item);
  }

  // Plans are part of memberships entitlement (separate list from customer memberships)
  if (
    ctx.enabledModuleKeys.includes("memberships") &&
    (ctx.permissionKeys.includes("memberships.view") ||
      ctx.permissionKeys.includes("memberships.manage") ||
      ctx.permissionKeys.includes("manage.all")) &&
    !navItems.some((i) => i.href === "/app/membership-plans")
  ) {
    const membershipsIdx = navItems.findIndex(
      (i) => i.href === "/app/memberships",
    );
    const item = {
      title: "Plans",
      href: "/app/membership-plans",
      icon: "Package",
      moduleKey: "memberships",
    };
    if (membershipsIdx >= 0) navItems.splice(membershipsIdx + 1, 0, item);
    else navItems.push(item);
  }

  const businessName = ctx.businessName;

  const shellNavItems = navItems.map(({ title, href, icon, moduleKey }) => {
    if (moduleKey === "accounting") {
      return {
        title,
        href,
        icon,
        children: [
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
      };
    }
    return { title, href, icon };
  });

  return (
    <DashboardShell
      navItems={shellNavItems}
      brand={
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-primary">
            NepGrow
          </span>
          <span className="truncate text-xs text-sidebar-foreground/70">
            {businessName ?? "Business"}
          </span>
        </div>
      }
      topbar={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="truncate text-sm text-muted-foreground">
            Client app · app.nepgrow.com
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/app/business"
              className="truncate text-sm font-medium underline-offset-4 hover:underline"
              title="View business profile"
            >
              {session.user.name || session.user.email}
            </Link>
            <ThemeToggle />
            <LogoutButton redirectTo="/app/login" />
          </div>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
