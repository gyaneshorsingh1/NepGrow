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

import { CreateAvailabilityForm } from "../create-availability-form";

export const metadata = { title: "New availability rule" };

export default async function NewAvailabilityPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "bookings");
  try {
    await authorize(ctx, "create", "bookings", "bookings");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need bookings.create to add availability rules." />
      );
    }
    throw error;
  }

  const courts = await prisma.court.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    include: { facility: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add availability rule"
        description="Set weekly opening hours for a court or all courts."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateAvailabilityForm
            courts={courts.map((c) => ({
              id: c.id,
              label: `${c.facility.name} · ${c.name}`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
