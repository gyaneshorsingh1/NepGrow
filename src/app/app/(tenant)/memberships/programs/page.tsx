import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Custom Programs" };

export default async function ProgramsPage() {
  const ctx = await resolveTenantContext();

  const programs = await prisma.customProgram.findMany({
    where: { businessId: ctx.businessId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Programs & Progress Tracking"
        description="Assign tailored service programs (like Workout Plans or Diets) and track customer metrics."
        actions={
          <Button asChild>
            <Link href="/app/memberships/programs/new">+ Assign Program</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program Name</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No programs assigned yet.
                </TableCell>
              </TableRow>
            )}
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">{program.name}</TableCell>
                <TableCell>{program.customer.name}</TableCell>
                <TableCell>{program.startDate ? format(program.startDate, "MMM d, yyyy") : "—"}</TableCell>
                <TableCell>{program.endDate ? format(program.endDate, "MMM d, yyyy") : "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={program.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
