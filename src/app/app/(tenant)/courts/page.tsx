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
import { authorize, requireModule, resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatTenantMoney } from "@/lib/utils";

import { CourtRowActions } from "./court-row-actions";

export const metadata = { title: "Courts" };

export default async function CourtsPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "courts");
  await authorize(ctx, "view", "courts", "courts");

  const [courts, facilities] = await Promise.all([
    prisma.court.findMany({
      where: { businessId: ctx.businessId },
      include: { facility: true },
      orderBy: { name: "asc" },
    }),
    prisma.facility.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const canCreate = ctx.ability.can("create", "courts");
  const canUpdate = ctx.ability.can("update", "courts");
  const canDelete = ctx.ability.can("delete", "courts");
  const activeFacilities = facilities.map((f) => ({ id: f.id, name: f.name }));
  const editFacilities = [...activeFacilities];
  for (const court of courts) {
    if (!editFacilities.some((f) => f.id === court.facilityId)) {
      editFacilities.push({
        id: court.facility.id,
        name: court.facility.name,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courts"
        description="Bookable courts within your facilities."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/courts/new">+ Add Court</Link>
            </Button>
          ) : null
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell className="font-medium">{court.name}</TableCell>
                <TableCell>{court.facility.name}</TableCell>
                <TableCell>{formatTenantMoney(court.hourlyRateCents, ctx)}</TableCell>
                <TableCell>{court.capacity ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={court.status} />
                </TableCell>
                <TableCell>
                  <CourtRowActions
                    court={court}
                    facilities={editFacilities}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    currencyDecimals={ctx.currencyDecimals}
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
