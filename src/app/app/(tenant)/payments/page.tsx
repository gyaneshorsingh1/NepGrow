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
import { resolveTenantContext } from "@/lib/authorization/context";
import { formatTenantMoney } from "@/lib/utils";
import { listPayments } from "@/server/services/sports";

import { PaymentRefundButton } from "./payment-refund-button";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const ctx = await resolveTenantContext();
  const payments = await listPayments(ctx);

  const canCreate = ctx.ability.can("create", "payments");
  const canRefund = ctx.ability.can("refund", "payments");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Recorded payments for bookings and memberships."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/app/payments/new">+ Record Payment</Link>
            </Button>
          ) : null
        }
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                  {p.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>{p.customer?.name ?? "—"}</TableCell>
                <TableCell>
                  {formatTenantMoney(p.amountCents, {
                    currency: p.currency || ctx.currency,
                    currencyDecimals: ctx.currencyDecimals,
                  })}
                </TableCell>
                <TableCell>{p.method ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  <PaymentRefundButton
                    paymentId={p.id}
                    status={p.status}
                    canRefund={canRefund}
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
