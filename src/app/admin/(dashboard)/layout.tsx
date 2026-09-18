import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getSession } from "@/lib/auth/session";

const ADMIN_NAV = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "Clients", href: "/admin/clients", icon: "Users" },
  { title: "Plans", href: "/admin/plans", icon: "Package" },
  { title: "Modules", href: "/admin/modules", icon: "Layers" },
  { title: "Currencies", href: "/admin/currencies", icon: "Coins" },
  { title: "Activity", href: "/admin/activity", icon: "ScrollText" },
  { title: "Categories", href: "/admin/categories", icon: "FolderTree" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Tenant users must not enter Super Admin (admin.nepgrow.com surface)
  if (!session.user.isPlatformAdmin) {
    redirect("/app");
  }

  return (
    <DashboardShell
      navItems={ADMIN_NAV}
      brand={
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-primary">
            NepGrow
          </span>
          <span className="text-xs text-sidebar-foreground/70">
            Super Admin
          </span>
        </div>
      }
      topbar={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="truncate text-sm text-muted-foreground">
            Platform console · admin.nepgrow.com
          </p>
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {session.user.name || session.user.email}
            </p>
            <ThemeToggle />
            <LogoutButton redirectTo="/admin/login" />
          </div>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
