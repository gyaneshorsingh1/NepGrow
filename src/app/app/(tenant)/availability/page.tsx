import Link from "next/link";

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
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { listAvailabilityRules } from "@/server/services/sports";

export const metadata = { title: "Availability" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AvailabilityPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "bookings");
  await authorize(ctx, "view", "bookings", "bookings");

  const rules = await listAvailabilityRules(ctx);

  const canCreate =
    ctx.ability.can("create", "bookings") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Weekly opening hours per court (or business-wide)."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/availability/new">+ Add Rule</Link>
            </Button>
          ) : null
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Court</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No availability rules yet.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{DAYS[r.dayOfWeek] ?? r.dayOfWeek}</TableCell>
                  <TableCell>
                    {r.startTime} – {r.endTime}
                  </TableCell>
                  <TableCell>{r.court?.name ?? "All courts"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
