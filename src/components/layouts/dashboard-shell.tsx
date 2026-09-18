"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarNav,
  type SidebarNavItem,
} from "@/components/layouts/sidebar-nav";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: SidebarNavItem[];
  brand?: React.ReactNode;
  topbar?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  className?: string;
}

function DashboardShell({
  children,
  navItems,
  brand,
  topbar,
  sidebarFooter,
  className,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <div className="hidden lg:block">
        <SidebarNav
          items={navItems}
          brand={brand}
          footer={sidebarFooter}
          className="fixed inset-y-0 left-0 z-30"
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <SidebarNav
            items={navItems}
            brand={brand}
            footer={sidebarFooter}
            className="relative z-50 h-full shadow-xl"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            {topbar ?? <div />}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export { DashboardShell };
export type { DashboardShellProps };
