import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { formatMoney } from "@/lib/utils";

import { CreateCourtForm } from "./create-court-form";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courts"
        description="Bookable courts within your facilities."
      />
      <CreateCourtForm
        facilities={facilities.map((f) => ({ id: f.id, name: f.name }))}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell className="font-medium">{court.name}</TableCell>
                <TableCell>{court.facility.name}</TableCell>
                <TableCell>{formatMoney(court.hourlyRateCents)}</TableCell>
                <TableCell>{court.capacity ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={court.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
