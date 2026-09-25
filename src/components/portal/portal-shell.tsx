import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/providers/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutPortalCustomerAction } from "@/features/portal/actions";
import { cn } from "@/lib/utils";

export function PortalShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-dvh bg-background text-foreground",
        "bg-[radial-gradient(ellipse_at_top,oklch(0.94_0.03_155_/_0.55),transparent_55%)]",
        "dark:bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.04_155_/_0.35),transparent_55%)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PortalBrandMark({
  name,
  href,
  size = "md",
  showName = true,
}: {
  name: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const sizes = {
    sm: "size-8 text-sm",
    md: "size-9 text-base sm:size-10 sm:text-lg",
    lg: "size-14 text-xl sm:size-16 sm:text-2xl",
  };

  const mark = (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary ring-1 ring-primary/20",
          sizes[size],
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      {showName ? (
        <span className="truncate font-semibold tracking-tight">{name}</span>
      ) : null}
    </div>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="min-w-0 transition-opacity hover:opacity-90">
      {mark}
    </Link>
  );
}

export function PortalAppHeader({
  businessName,
  businessSlug,
  customerName,
  backHref,
  backLabel = "Back",
}: {
  businessName: string;
  businessSlug: string;
  customerName?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {backHref ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0 -ml-2 px-2 sm:px-3"
            >
              <Link href={backHref}>
                <ArrowLeft className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5">
                  {backLabel}
                </span>
              </Link>
            </Button>
          ) : (
            <PortalBrandMark
              name={businessName}
              href={`/portal/${businessSlug}/dashboard`}
              size="sm"
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {customerName ? (
            <span className="mr-1 hidden max-w-[10rem] truncate text-sm text-muted-foreground md:inline lg:max-w-[14rem]">
              Hi, <span className="font-medium text-foreground">{customerName}</span>
            </span>
          ) : null}
          <ThemeToggle />
          <form action={logoutPortalCustomerAction.bind(null, businessSlug)}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">Log out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function PortalMain({
  children,
  narrow,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 py-5 sm:px-6 sm:py-8 md:px-8 md:py-10",
        "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        narrow ? "max-w-3xl" : "max-w-5xl",
      )}
    >
      {children}
    </main>
  );
}
