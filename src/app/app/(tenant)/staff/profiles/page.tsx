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

  const staff = await prisma.staffProfile.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { name: "asc" },
  });

  const canCreateStaff =
    ctx.ability.can("create", "staff") || ctx.isPlatformAdmin;
  const canUpdateStaff =
    ctx.ability.can("update", "staff") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Profiles"
        description="Operational staff profiles at your center."
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
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.title ?? "—"}</TableCell>
                <TableCell>{s.email || s.phone || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-right">
                  <StaffRowActions staff={s} canUpdate={canUpdateStaff} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}