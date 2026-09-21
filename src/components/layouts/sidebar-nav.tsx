"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus } from "lucide-react";

import { resolveIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  title: string;
  href: string;
  /** Lucide icon name string — must be serializable from Server Components */
  icon?: string;
  disabled?: boolean;
  children?: SidebarNavItem[];
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
  brand?: React.ReactNode;
  footer?: React.ReactNode;
}

function isPathActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/" &&
      href !== "/admin" &&
      href !== "/app" &&
      pathname.startsWith(`${href}/`)) ||
    (href === "/admin" && pathname === "/admin") ||
    (href === "/app" && pathname === "/app")
  );
}

function itemOrChildActive(pathname: string, item: SidebarNavItem): boolean {
  if (isPathActive(pathname, item.href)) return true;
  return Boolean(item.children?.some((child) => isPathActive(pathname, child.href)));
}

function SidebarNav({
  items,
  brand,
  footer,
  className,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      if (item.children?.length && itemOrChildActive(pathname, item)) {
        initial[item.href] = true;
      }
    }
    return initial;
  });

  React.useEffect(() => {
    setOpenKeys((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        if (item.children?.length && itemOrChildActive(pathname, item) && !next[item.href]) {
          next[item.href] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, items]);

  function toggle(href: string) {
    setOpenKeys((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    >
      {brand ? (
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          {brand}
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = resolveIcon(item.icon);
          const hasChildren = Boolean(item.children?.length);
          const active = itemOrChildActive(pathname, item);
          const expanded = Boolean(openKeys[item.href]);
          const children = item.children ?? [];
          let activeChildHref: string | null = null;
          for (const child of children) {
            if (isPathActive(pathname, child.href)) {
              if (
                !activeChildHref ||
                child.href.length > activeChildHref.length
              ) {
                activeChildHref = child.href;
              }
            }
          }

          return (
            <div key={item.href} className="space-y-0.5">
              <div
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  item.disabled && "pointer-events-none opacity-50",
                )}
              >
                <Link
                  href={item.disabled ? "#" : item.href}
                  aria-disabled={item.disabled}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2"
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.title}</span>
                </Link>
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={expanded ? `Collapse ${item.title}` : `Expand ${item.title}`}
                    aria-expanded={expanded}
                    className="mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(item.href);
                    }}
                  >
                    {expanded ? (
                      <Minus className="size-3.5" aria-hidden />
                    ) : (
                      <Plus className="size-3.5" aria-hidden />
                    )}
                  </button>
                ) : null}
              </div>

              {hasChildren && expanded ? (
                <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                  {children.map((child) => {
                    const ChildIcon = resolveIcon(child.icon);
                    const childActive = child.href === activeChildHref;
                    return (
                      <Link
                        key={child.href}
                        href={child.disabled ? "#" : child.href}
                        aria-disabled={child.disabled}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          childActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                          child.disabled && "pointer-events-none opacity-50",
                        )}
                      >
                        <ChildIcon className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {footer ? (
        <div className="border-t border-sidebar-border p-3">{footer}</div>
      ) : null}
    </aside>
  );
}

export { SidebarNav };
export type { SidebarNavProps };
