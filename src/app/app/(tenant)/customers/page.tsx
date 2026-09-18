import Link from "next/link";

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
import { resolveTenantContext } from "@/lib/authorization/context";
import { listCustomers } from "@/server/services/sports";

import { CustomerRowActions } from "./customer-row-actions";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const ctx = await resolveTenantContext();
  const customers = await listCustomers(ctx);
  const canCreate = ctx.ability.can("create", "customers");
  const canUpdate = ctx.ability.can("update", "customers");
  const canDelete = ctx.ability.can("delete", "customers");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="People who book and hold memberships."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/customers/new">+ Add Customer</Link>
            </Button>
          ) : null
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <CustomerRowActions
                    customer={c}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
