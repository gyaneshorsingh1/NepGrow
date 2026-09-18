import { redirect } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  Layers,
  Package,
  ScrollText,
  Users,
} from "lucide-react";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { getSession } from "@/lib/auth/session";

const ADMIN_NAV = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Clients", href: "/admin/clients", icon: Users },
  { title: "Plans", href: "/admin/plans", icon: Package },
  { title: "Modules", href: "/admin/modules", icon: Layers },
  { title: "Activity", href: "/admin/activity", icon: ScrollText },
  { title: "Categories", href: "/admin/categories", icon: FolderTree },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user as
    | { isPlatformAdmin?: boolean; name?: string; email?: string }
    | undefined;

  if (!session?.user || !user?.isPlatformAdmin) {
    redirect("/admin/login");
  }

  return (
    <DashboardShell
      navItems={ADMIN_NAV}
      brand={
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-primary">
            NepGrow
          </span>
          <span className="text-xs text-sidebar-foreground/70">Platform</span>
        </div>
      }
      topbar={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="truncate text-sm text-muted-foreground">
            Super admin console
          </p>
          <p className="truncate text-sm font-medium">
            {user.name || user.email}
          </p>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
