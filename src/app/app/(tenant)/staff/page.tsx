import Link from "next/link";
import { Eye } from "lucide-react";

import { AccessDenied } from "@/components/shared/access-denied";
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
import { resolveTenantContext } from "@/lib/authorization/context";
import { listEmployees } from "@/server/services/employees";

export const metadata = { title: "Employees" };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const ctx = await resolveTenantContext();

  if (!ctx.ability.can("view", "users") && !ctx.isPlatformAdmin) {
    return (
      <AccessDenied description="You need users.view to open employees." />
    );
  }

  const statusFilter =
    status === "ACTIVE" || status === "DISABLED" ? status : undefined;

  const members = await listEmployees(ctx, {
    search: q?.trim() || undefined,
    status: statusFilter,
  });

  const canCreateEmployee =
    ctx.ability.can("create", "users") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="App users with roles and permissions for this business."
        actions={
          canCreateEmployee ? (
            <Button asChild>
              <Link href="/app/staff/new">+ Create Employee</Link>
            </Button>
          ) : null
        }
      />

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
    </div>
  );
}