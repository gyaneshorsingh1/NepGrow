import Link from "next/link";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessDenied } from "@/components/shared/access-denied";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { listEmployees } from "@/server/services/employees";

import { StaffRowActions } from "./staff-row-actions";

export const metadata = { title: "Staff & Employees" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const ctx = await resolveTenantContext();

  const canViewUsers =
    ctx.ability.can("view", "users") || ctx.isPlatformAdmin;
  const canViewStaff =
    ctx.enabledModuleKeys.includes("staff") &&
    (ctx.ability.can("view", "staff") || ctx.isPlatformAdmin);

  if (!canViewUsers && !canViewStaff) {
    return (
      <AccessDenied description="You need users.view or staff.view to open this page." />
    );
  }

  if (canViewStaff) {
    await requireModule(ctx, "staff");
    await authorize(ctx, "view", "staff", "staff");
  }

  const statusFilter =
    status === "ACTIVE" || status === "DISABLED" ? status : undefined;

  const [staff, members] = await Promise.all([
    canViewStaff
      ? prisma.staffProfile.findMany({
          where: { businessId: ctx.businessId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    canViewUsers
      ? listEmployees(ctx, {
          search: q?.trim() || undefined,
          status: statusFilter,
        })
      : Promise.resolve([]),
  ]);

  const canCreateEmployee =
    ctx.ability.can("create", "users") || ctx.isPlatformAdmin;
  const canCreateStaff =
    canViewStaff &&
    (ctx.ability.can("create", "staff") || ctx.isPlatformAdmin);
  const canUpdateStaff =
    canViewStaff &&
    (ctx.ability.can("update", "staff") || ctx.isPlatformAdmin);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Employees"
        description="App users with roles, and operational staff profiles."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreateStaff ? (
              <Button asChild variant="outline">
                <Link href="/app/staff/profiles/new">+ Add Staff Profile</Link>
              </Button>
            ) : null}
            {canCreateEmployee ? (
              <Button asChild>
                <Link href="/app/staff/new">+ Create Employee</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {canViewUsers ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Employees</h2>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="max-w-sm flex-1">
              <Input
                name="q"
                placeholder="Search employees…"
                defaultValue={q ?? ""}
              />
            </div>
            <Select name="status" defaultValue={statusFilter ?? ""}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </Select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium">{m.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.roles.map((r) => r.role.name).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="View">
                          <Link href={`/app/staff/${m.id}`}>
                            <Eye aria-hidden />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      {canViewStaff ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Staff profiles</h2>
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
        </section>
      ) : null}
    </div>
  );
}
