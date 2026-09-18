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
import { listFacilities } from "@/server/services/sports";

import { FacilityRowActions } from "./facility-row-actions";

export const metadata = { title: "Facilities" };

export default async function FacilitiesPage() {
  const ctx = await resolveTenantContext();
  const facilities = await listFacilities(ctx);
  const canCreate = ctx.ability.can("create", "facilities");
  const canUpdate = ctx.ability.can("update", "facilities");
  const canDelete = ctx.ability.can("delete", "facilities");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        description="Sports facilities available at your center."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/facilities/new">+ Add Facility</Link>
            </Button>
          ) : null
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Courts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell>{f.sport}</TableCell>
                <TableCell>{f.courts.length}</TableCell>
                <TableCell>
                  <StatusBadge status={f.status} />
                </TableCell>
                <TableCell>
                  <FacilityRowActions
                    facility={f}
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
