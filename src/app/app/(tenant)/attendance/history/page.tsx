import { format } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
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

export const metadata = { title: "Attendance History" };

export default async function AttendanceHistoryPage() {
  const ctx = await resolveTenantContext();

  const attendance = await prisma.checkIn.findMany({
    where: { businessId: ctx.businessId },
    include: {
      customer: true,
      facility: true,
    },
    orderBy: {
      checkInAt: "desc",
    },
    take: 100, // Limit to recent 100 for now
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History"
        description="View past check-ins and check-outs across all facilities."
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Check-out Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
            {attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.customer.name}</TableCell>
                <TableCell>{record.facility?.name ?? "—"}</TableCell>
                <TableCell>{format(record.checkInAt, "MMM d, yyyy")}</TableCell>
                <TableCell>{format(record.checkInAt, "p")}</TableCell>
                <TableCell>{record.checkOutAt ? format(record.checkOutAt, "p") : "—"}</TableCell>
                <TableCell>{record.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
