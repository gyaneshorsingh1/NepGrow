import Link from "next/link";
import { Pencil } from "lucide-react";

import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { listBusinessRoles } from "@/server/services/roles";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await resolveTenantContext();

  let roles;
  try {
    roles = await listBusinessRoles(ctx, q?.trim() || undefined);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return <AccessDenied description="You need roles.view to manage roles." />;
    }
    throw error;
  }

  const canCreate = ctx.ability.can("create", "roles") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage business-scoped roles and their permission sets."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/roles/new">+ Create Role</Link>
            </Button>
          ) : null
        }
      />

      <form className="max-w-sm">
        <Input
          name="q"
          placeholder="Search roles…"
          defaultValue={q ?? ""}
        />
      </form>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="font-medium">{role.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {role.key}
                    </div>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="mt-1">
                        System
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{role._count.memberships}</TableCell>
                  <TableCell>{role.permissions.length}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" title="View / Edit">
                      <Link href={`/app/roles/${role.id}`}>
                        <Pencil aria-hidden />
                        <span className="sr-only">View / Edit</span>
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
