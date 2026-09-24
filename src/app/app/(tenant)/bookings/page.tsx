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
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { formatTenantMoney } from "@/lib/utils";
import { listBookings } from "@/server/services/sports";

import { BookingStatusActions } from "./booking-status-actions";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "bookings");
  await authorize(ctx, "view", "bookings", "bookings");

  const bookings = await listBookings(ctx);

  const canCreate = ctx.ability.can("create", "bookings");
  const canCancel = ctx.ability.can("cancel", "bookings");
  const canUpdate = ctx.ability.can("update", "bookings");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Court reservations for your customers."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/bookings/new">+ Create Booking</Link>
            </Button>
          ) : null
        }
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {b.startAt.toLocaleString()} → {b.endAt.toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {b.court ? `${b.court.facility.name} · ${b.court.name}` : `PT Session w/ ${b.staffProfile?.name ?? "Trainer"}`}
                </TableCell>
                <TableCell>{b.customer?.name ?? "Walk-in"}</TableCell>
                <TableCell>{formatTenantMoney(b.totalCents, ctx)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell>
                  <BookingStatusActions
                    bookingId={b.id}
                    status={b.status}
                    canCancel={canCancel}
                    canUpdate={canUpdate}
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
