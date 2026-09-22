import Link from "next/link";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClickableTableRow,
  RowActionsCell,
} from "@/components/shared/clickable-table-row";
import { CancelMembershipButton } from "@/app/app/(tenant)/memberships/cancel-membership-button";
import { MembershipPaymentActions } from "@/app/app/(tenant)/memberships/membership-payment-actions";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatTenantMoney } from "@/lib/utils";
import { listMemberships } from "@/server/services/memberships";

export const metadata = { title: "Memberships" };

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");

  const memberStatus =
    status === "ACTIVE" || status === "EXPIRED" || status === "CANCELLED"
      ? status
      : undefined;

  const memberships = await listMemberships(ctx, {
    search: q?.trim() || undefined,
    status: memberStatus,
  });

  const accounts = await prisma.cashbookAccount.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const canAssign =
    ctx.ability.can("assign", "memberships") ||
    ctx.ability.can("create", "memberships") ||
    ctx.isPlatformAdmin;
  const canCancel =
    ctx.ability.can("cancel", "memberships") ||
    ctx.ability.can("update", "memberships") ||
    ctx.isPlatformAdmin;
  const canPay =
    ctx.ability.can("create", "payments") ||
    ctx.ability.can("update", "memberships") ||
    ctx.ability.can("assign", "memberships") ||
    ctx.isPlatformAdmin;
  const canRefund =
    ctx.ability.can("refund", "payments") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Memberships"
        description="Customer memberships assigned to plans."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/membership-plans">Plans</Link>
            </Button>
            {canAssign ? (
              <Button asChild>
                <Link href="/app/memberships/assign">Assign Membership</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            name="q"
            placeholder="Search members…"
            defaultValue={q ?? ""}
            className="sm:w-48"
          />
          <Select name="status" defaultValue={memberStatus ?? ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          title="No memberships yet"
          description="Assign an active plan to a customer to create a membership record."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Payment status</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <ClickableTableRow key={m.id} href={`/app/memberships/${m.id}`}>
                  <TableCell className="font-medium">{m.customer.name}</TableCell>
                  <TableCell>{m.product.name}</TableCell>
                  <TableCell>{formatTenantMoney(m.priceCents, ctx)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {m.startDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {m.endDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    {m.payment ? (
                      <StatusBadge status={m.payment.status} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <RowActionsCell>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" title="View">
                        <Link href={`/app/memberships/${m.id}`}>
                          <Eye aria-hidden />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <MembershipPaymentActions
                        membershipId={m.id}
                        paymentId={m.payment?.id ?? null}
                        paymentStatus={m.payment?.status ?? null}
                        amount={m.priceCents}
                        currency={ctx.currency}
                        currencyDecimals={ctx.currencyDecimals}
                        accounts={accounts}
                        canPay={canPay}
                        canRefund={canRefund}
                      />
                      {canCancel && m.status === "ACTIVE" ? (
                        <CancelMembershipButton membershipId={m.id} />
                      ) : null}
                    </div>
                  </RowActionsCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
