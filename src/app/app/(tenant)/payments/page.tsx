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
import { listPayments } from "@/server/services/sports";

import { CreatePaymentForm } from "./create-payment-form";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const ctx = await resolveTenantContext();
  const [payments, customers] = await Promise.all([
    listPayments(ctx),
    prisma.customer.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Recorded payments for bookings and memberships."
      />
      <CreatePaymentForm
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {p.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>{p.customer?.name ?? "—"}</TableCell>
                <TableCell>{formatMoney(p.amountCents, p.currency)}</TableCell>
                <TableCell>{p.method ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
