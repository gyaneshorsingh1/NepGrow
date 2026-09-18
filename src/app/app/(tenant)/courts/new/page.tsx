import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";

import { CreateCourtForm } from "../create-court-form";

export const metadata = { title: "New court" };

export default async function NewCourtPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "courts");
  try {
    await authorize(ctx, "create", "courts", "courts");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need courts.create to add courts." />
      );
    }
    throw error;
  }

  const facilities = await prisma.facility.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add court"
        description="Create a bookable court within a facility."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateCourtForm
            facilities={facilities}
            currencyDecimals={ctx.currencyDecimals}
          />
        </CardContent>
      </Card>
    </div>
  );
}
