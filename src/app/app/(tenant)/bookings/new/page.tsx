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

import { CreateBookingForm } from "../create-booking-form";

export const metadata = { title: "New booking" };

export default async function NewBookingPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "bookings");
  try {
    await authorize(ctx, "create", "bookings", "bookings");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need bookings.create to add bookings." />
      );
    }
    throw error;
  }

  const [courts, staff, customers, business] = await Promise.all([
    prisma.court.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      include: { facility: true },
      orderBy: { name: "asc" },
    }),
    prisma.staffProfile.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        hourlyRateCents: true,
      },
    }),
    prisma.customer.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true },
    }),
    prisma.business.findUnique({
      where: { id: ctx.businessId },
      select: { currency: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create booking"
        description="Reserve a court and/or staff session. Charge auto-fills from hourly rates × duration."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateBookingForm
            currency={business?.currency ?? "NPR"}
            courts={courts.map((c) => ({
              id: c.id,
              name: c.name,
              facilityName: c.facility.name,
              hourlyRateCents: c.hourlyRateCents,
            }))}
            staff={staff}
            customers={customers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
