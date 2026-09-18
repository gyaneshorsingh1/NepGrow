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

  const [courts, customers] = await Promise.all([
    prisma.court.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      include: { facility: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create booking"
        description="Reserve a court for a customer or walk-in."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateBookingForm
            courts={courts.map((c) => ({
              id: c.id,
              name: c.name,
              facilityName: c.facility.name,
            }))}
            customers={customers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
