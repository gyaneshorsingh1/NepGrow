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
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { listBookings } from "@/server/services/sports";

import { CreateBookingForm } from "./create-booking-form";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const ctx = await resolveTenantContext();
  const [bookings, courts, customers] = await Promise.all([
    listBookings(ctx),
    prisma.court.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      include: { facility: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Court reservations for your customers."
      />
      <CreateBookingForm
        courts={courts.map((c) => ({
          id: c.id,
          name: c.name,
          facilityName: c.facility.name,
        }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {b.startAt.toLocaleString()} → {b.endAt.toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {b.court.facility.name} · {b.court.name}
                </TableCell>
                <TableCell>{b.customer?.name ?? "Walk-in"}</TableCell>
                <TableCell>{formatMoney(b.totalCents)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
