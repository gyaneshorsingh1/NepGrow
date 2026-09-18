import Link from "next/link";

import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";

import { CreateAccountForm } from "../create-account-form";

export const metadata = { title: "New cashbook account" };

export default async function NewCashbookAccountPage() {
  const ctx = await resolveTenantContext();
  try {
    await authorize(ctx, "create", "accounting", "accounting");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need accounting.create to add cashbook accounts." />
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add account"
        description="Add a cash, bank, or wallet account used for bookkeeping."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/accounting/cashbook">Back to accounts</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <CreateAccountForm currencyDecimals={ctx.currencyDecimals} />
        </CardContent>
      </Card>
    </div>
  );
}