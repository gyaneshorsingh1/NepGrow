import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  const ctx = await resolveTenantContext();
  await authorize(ctx, "view", "roles");

  const roles = await prisma.role.findMany({
    where: { businessId: ctx.businessId },
    include: {
      permissions: true,
      _count: { select: { memberships: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Permission sets assigned to staff memberships."
        actions={
          <Button asChild>
            <Link href="/app/roles/new">New role</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="font-mono text-xs">{role.key}</TableCell>
                <TableCell>{role.permissions.length}</TableCell>
                <TableCell>{role._count.memberships}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
