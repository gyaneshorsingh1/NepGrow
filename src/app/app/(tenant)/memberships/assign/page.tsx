import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { listMembershipProducts } from "@/server/services/memberships";

import { AssignMembershipForm } from "../assign-membership-form";

export const metadata = { title: "Assign membership" };

export default async function AssignMembershipPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");

  const canAssign =
    ctx.ability.can("assign", "memberships") ||
    ctx.ability.can("create", "memberships") ||
    ctx.isPlatformAdmin;

  if (!canAssign) {
    return (
      <AccessDenied description="You need memberships.assign to assign plans." />
    );
  }

  const [products, customers, accounts] = await Promise.all([
    listMembershipProducts(ctx, { status: "ACTIVE" }),
    prisma.customer.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true },
    }),
    prisma.cashbookAccount.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign membership"
        description="Assign an active plan to a customer."
      />
      <Card>
        <CardContent className="pt-6">
          <AssignMembershipForm
            customers={customers}
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              priceCents: p.priceCents,
              durationDays: p.durationDays,
            }))}
            accounts={accounts}
            currency={ctx.currency}
            currencyDecimals={ctx.currencyDecimals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
