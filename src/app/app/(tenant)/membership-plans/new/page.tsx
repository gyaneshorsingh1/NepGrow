import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { CreateMembershipProductForm } from "@/app/app/(tenant)/memberships/create-membership-form";

export const metadata = { title: "New plan" };

export default async function NewMembershipPlanPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");
  try {
    await authorize(ctx, "create", "memberships", "memberships");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need memberships.create to add plans." />
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create plan"
        description="Define a plan with price, duration, and benefits."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateMembershipProductForm currencyDecimals={ctx.currencyDecimals} />
        </CardContent>
      </Card>
    </div>
  );
}
