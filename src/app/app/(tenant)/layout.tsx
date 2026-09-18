import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

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

  let ctx;
  try {
    ctx = await resolveTenantContext();
  } catch (error) {
    if (error instanceof AppError && error.code === "UNAUTHORIZED") {
      redirect("/app/login");
    }
    redirect("/app/login");
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
      icon: Shield,
      moduleKey: "roles",
    });
  }

  const business = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    select: { name: true },
  });

  return (
    <DashboardShell
      navItems={navItems.map(({ title, href, icon }) => ({
        title,
        href,
        icon,
      }))}
      brand={
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-primary">
            NepGrow
          </span>
          <span className="truncate text-xs text-sidebar-foreground/70">
            {business?.name ?? "Business"}
          </span>
        </div>
      }
      topbar={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="truncate text-sm text-muted-foreground">Tenant app</p>
          <p className="truncate text-sm font-medium">
            {session.user.name || session.user.email}
          </p>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
