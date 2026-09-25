import Link from "next/link";

import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { listAssignableRoles } from "@/server/services/employees";

import { StaffRowActions } from "../staff-row-actions";

export const metadata = { title: "Staff Profiles" };

export default async function StaffProfilesPage() {
  const ctx = await resolveTenantContext();

  const canViewStaff =
    ctx.enabledModuleKeys.includes("staff") &&
    (ctx.ability.can("view", "staff") || ctx.isPlatformAdmin);

  if (!canViewStaff) {
    return (
      <AccessDenied description="You need staff.view to open staff profiles." />
    );
  }

  await requireModule(ctx, "staff");
  await authorize(ctx, "view", "staff", "staff");

  const [staff, roles] = await Promise.all([
    prisma.staffProfile.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
    }),
    listAssignableRoles(ctx),
  ]);

  const canCreateStaff =
    ctx.ability.can("create", "staff") || ctx.isPlatformAdmin;
  const canUpdateStaff =
    ctx.ability.can("update", "staff") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Profiles"
        description="Staff with app logins. Assign roles to control access."
        actions={
          canCreateStaff ? (
            <Button asChild>
              <Link href="/app/staff/profiles/new">+ Add Staff Profile</Link>
            </Button>
          ) : null
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Hourly rate</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No staff profiles yet.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.title ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {s.hourlyRateCents > 0 ? s.hourlyRateCents : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{s.email || "—"}</div>
                    {s.phone ? (
                      <div className="text-xs text-muted-foreground">
                        {s.phone}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {s.userId ? (
                      <span className="text-xs font-medium text-primary">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not set
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <StaffRowActions
                      staff={s}
                      canUpdate={canUpdateStaff}
                      roles={roles}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
