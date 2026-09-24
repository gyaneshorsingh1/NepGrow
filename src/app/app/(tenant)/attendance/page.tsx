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
import { getTodayAttendance } from "@/features/attendance/actions";

export const metadata = { title: "Today's Attendance" };

export default async function AttendancePage() {
  const ctx = await resolveTenantContext();
  const attendance = await getTodayAttendance(ctx.businessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Attendance"
        description="Monitor currently active visitors and today's check-ins."
        actions={
          <Button asChild>
            <Link href="/app/attendance/check-in">+ Check In</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Check-out Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No check-ins today yet.
                </TableCell>
              </TableRow>
            )}
            {attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.customer.name}</TableCell>
                <TableCell>{record.facility?.name ?? "—"}</TableCell>
                <TableCell>{format(record.checkInAt, "p")}</TableCell>
                <TableCell>{record.checkOutAt ? format(record.checkOutAt, "p") : "—"}</TableCell>
                <TableCell>{record.notes ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {!record.checkOutAt && (
                    <form action={async () => {
                      "use server";
                      const { checkOutAction } = await import("@/features/attendance/actions");
                      await checkOutAction(record.id);
                    }}>
                      <Button variant="outline" size="sm" type="submit">
                        Check Out
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
