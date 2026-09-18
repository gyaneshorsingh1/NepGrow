import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = NonNullable<BadgeProps["variant"]>;

const STATUS_MAP: Record<string, { label: string; variant: StatusTone }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "muted" },
  DISABLED: { label: "Disabled", variant: "muted" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  TRIAL: { label: "Trial", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  CANCELED: { label: "Cancelled", variant: "destructive" },
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  PAST_DUE: { label: "Past due", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "muted" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function humanizeStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface StatusBadgeProps extends Omit<BadgeProps, "children" | "variant"> {
  status: string;
  label?: string;
}

function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const key = status.toUpperCase();
  const mapped = STATUS_MAP[key];

  return (
    <Badge
      variant={mapped?.variant ?? "outline"}
      className={cn("capitalize", className)}
      {...props}
    >
      {label ?? mapped?.label ?? humanizeStatus(status)}
    </Badge>
  );
}

export { StatusBadge, STATUS_MAP };
export type { StatusBadgeProps };
