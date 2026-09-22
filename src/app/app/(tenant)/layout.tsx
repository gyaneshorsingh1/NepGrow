import { redirect } from "next/navigation";
import Link from "next/link";

import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getSession } from "@/lib/auth/session";
import { resolveTenantContext } from "@/lib/authorization/context";
import { buildTenantSidebar } from "@/lib/authorization/sidebar";
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

  const navItems = buildTenantSidebar(modules, ctx);

  const businessName = ctx.businessName;

  return (
    <DashboardShell
      navItems={navItems}
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
