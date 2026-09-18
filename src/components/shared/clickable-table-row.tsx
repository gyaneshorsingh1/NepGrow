"use client";

import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClickableTableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      className={cn("cursor-pointer", className)}
      tabIndex={0}
      role="link"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </TableRow>
  );
}

/** Wrap action buttons so row click does not navigate. */
export function RowActionsCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn("p-3 align-middle text-right", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </td>
  );
}
