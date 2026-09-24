import Link from "next/link";
import { format } from "date-fns";

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
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { Calendar as CalendarIcon } from "lucide-react";

export const metadata = { title: "Trainer Schedule" };

export default async function TrainerSchedulePage() {
  const ctx = await resolveTenantContext();

  const trainerBookings = await prisma.booking.findMany({
    where: { 
      businessId: ctx.businessId,
      staffProfileId: { not: null }
    },
    include: {
      staffProfile: true,
      customer: true
    },
    orderBy: { startAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainer Schedule"
        description="Manage 1-on-1 Personal Training bookings and staff schedules."
        actions={
          <Button asChild>
            <Link href="/app/bookings/new">+ New PT Session</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainerBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No Personal Training sessions scheduled.
                </TableCell>
              </TableRow>
            )}
            {trainerBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="font-medium">{format(booking.startAt, "MMM d, yyyy")}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(booking.startAt, "h:mm a")} - {format(booking.endAt, "h:mm a")}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {booking.staffProfile?.name || "Unassigned"}
                </TableCell>
                <TableCell>
                  {booking.customer ? booking.customer.name : "Guest/Walk-in"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 mr-2" /> Reschedule
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
