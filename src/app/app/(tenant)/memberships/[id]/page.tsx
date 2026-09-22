import Link from "next/link";
import { notFound } from "next/navigation";

import { CancelMembershipButton } from "@/app/app/(tenant)/memberships/cancel-membership-button";
import { MembershipPaymentActions } from "@/app/app/(tenant)/memberships/membership-payment-actions";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { formatTenantMoney } from "@/lib/utils";
import { getMembership } from "@/server/services/memberships";

export const metadata = { title: "Membership details" };

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");

  let membership;
  try {
    await authorize(ctx, "view", "memberships", "memberships");
    membership = await getMembership(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

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

  const accounts = await prisma.cashbookAccount.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={membership.customer.name}
        description={`Membership · ${membership.product.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/memberships">Back to memberships</Link>
            </Button>
            <MembershipPaymentActions
              membershipId={membership.id}
              paymentId={membership.payment?.id ?? null}
              paymentStatus={membership.payment?.status ?? null}
              amount={membership.priceCents}
              currency={ctx.currency}
              currencyDecimals={ctx.currencyDecimals}
              accounts={accounts}
              canPay={canPay}
              canRefund={canRefund}
            />
            {canCancel && membership.status === "ACTIVE" ? (
              <CancelMembershipButton membershipId={membership.id} />
            ) : null}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={membership.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-medium">
              <Link
                href={`/app/membership-plans/${membership.product.id}`}
                className="underline-offset-2 hover:underline"
              >
                {membership.product.name}
              </Link>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">{membership.customer.name}</p>
            {membership.customer.email ? (
              <p className="text-xs text-muted-foreground">
                {membership.customer.email}
              </p>
            ) : null}
            {membership.customer.phone ? (
              <p className="text-xs text-muted-foreground">
                {membership.customer.phone}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price (snapshot)</p>
            <p className="font-medium">
              {formatTenantMoney(membership.priceCents, ctx)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start</p>
            <p className="font-medium">
              {membership.startDate.toISOString().slice(0, 10)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End</p>
            <p className="font-medium">
              {membership.endDate.toISOString().slice(0, 10)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Payment</p>
            {membership.payment ? (
              <div className="mt-1 space-y-1 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {formatTenantMoney(membership.payment.amountCents, {
                    currency: membership.payment.currency || ctx.currency,
                    currencyDecimals: ctx.currencyDecimals,
                  })}
                  <StatusBadge status={membership.payment.status} />
                </p>
                {membership.payment.method ? (
                  <p className="text-muted-foreground">
                    Method: {membership.payment.method}
                  </p>
                ) : null}
                {membership.payment.reference ? (
                  <p className="text-muted-foreground">
                    Reference: {membership.payment.reference}
                  </p>
                ) : null}
                {membership.payment.notes ? (
                  <p className="text-muted-foreground">
                    {membership.payment.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
