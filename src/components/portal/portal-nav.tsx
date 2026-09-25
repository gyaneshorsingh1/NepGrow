"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Dumbbell,
  Home,
  LogOut,
  Menu,
  UserCircle,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/providers/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutPortalCustomerAction } from "@/features/portal/actions";
import { cn } from "@/lib/utils";

import { PortalBrandMark, PortalShell } from "./portal-shell";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match?: "exact" | "prefix";
};

export function PortalAuthenticatedChrome({
  businessName,
  businessSlug,
  customerName,
  canBookCourt,
  children,
}: {
  businessName: string;
  businessSlug: string;
  customerName: string;
  canBookCourt: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/portal/${businessSlug}`;

  const items: NavItem[] = [
    {
      href: `${base}/dashboard`,
      label: "Home",
      icon: <Home className="size-4" />,
      match: "exact",
    },
    {
      href: `${base}/book`,
      label: "Book PT",
      icon: <Dumbbell className="size-4" />,
      match: "exact",
    },
    ...(canBookCourt
      ? [
          {
            href: `${base}/book-court`,
            label: "Book Court",
            icon: <Calendar className="size-4" />,
            match: "exact" as const,
          },
        ]
      : []),
    {
      href: `${base}/bookings`,
      label: "My Bookings",
      icon: <Calendar className="size-4" />,
      match: "exact",
    },
    {
      href: `${base}/memberships`,
      label: "Memberships",
      icon: <UserCircle className="size-4" />,
      match: "exact",
    },
  ];

  function isActive(item: NavItem) {
    if (item.match === "prefix") return pathname.startsWith(item.href);
    return pathname === item.href;
  }

  const navLinks = (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item)
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <PortalShell>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        {/* Desktop / tablet sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border/80 bg-card/60 md:flex lg:w-64">
          <div className="border-b border-border/80 p-4">
            <PortalBrandMark
              name={businessName}
              href={`${base}/dashboard`}
              size="sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">{navLinks}</div>
          <div className="space-y-2 border-t border-border/80 p-3">
            <p className="truncate px-2 text-xs text-muted-foreground">
              {customerName}
            </p>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form
                action={logoutPortalCustomerAction.bind(null, businessSlug)}
                className="flex-1"
              >
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/80 bg-background/90 px-3 backdrop-blur md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <PortalBrandMark
              name={businessName}
              href={`${base}/dashboard`}
              size="sm"
              showName={false}
            />
            <ThemeToggle />
          </header>

          {/* Mobile drawer */}
          {open ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-background/70 backdrop-blur-sm"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <PortalBrandMark name={businessName} size="sm" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">{navLinks}</div>
                <div className="border-t border-border p-3">
                  <form
                    action={logoutPortalCustomerAction.bind(null, businessSlug)}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          <main
            className={cn(
              "flex-1 px-4 py-5 sm:px-6 sm:py-8 md:px-8",
              "pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] md:pb-10",
            )}
          >
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-1 py-1.5">
              {items.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium",
                    isActive(item)
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </PortalShell>
  );
}
