import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";

import { CreatePaymentForm } from "../create-payment-form";

export const metadata = { title: "New payment" };

export default async function NewPaymentPage() {
  const ctx = await resolveTenantContext();
  try {
    await authorize(ctx, "create", "payments");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need payments.create to record payments." />
      );
    }
    throw error;
  }

  const [customers, accounts] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId: ctx.businessId },
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
        title="Record payment"
        description="Log a payment for a booking or membership."
      />
      <Card>
        <CardContent className="pt-6">
          <CreatePaymentForm
            customers={customers}
            accounts={accounts}
            currencyDecimals={ctx.currencyDecimals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
