import { redirect } from "next/navigation";

import { PortalCourtBookingForm } from "./court-booking-form";
import {
  getPortalAccessFlags,
  getPortalSession,
} from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "Book Court" };

export default async function PortalBookCourtPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();
  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const flags = await getPortalAccessFlags(
    session.customer.id,
    session.business.id,
  );
  if (!flags.canBookCourt) {
    redirect(`/portal/${businessSlug}/dashboard`);
  }

  const courts = await prisma.court.findMany({
    where: { businessId: session.business.id, status: "ACTIVE" },
    include: { facility: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Book a court
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Court rates are fixed. Total is calculated from rate × duration.
        </p>
      </div>

      {courts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No courts are available to book right now.
        </p>
      ) : (
        <PortalCourtBookingForm
          businessSlug={session.business.slug}
          currency={session.business.currency}
          courts={courts.map((c) => ({
            id: c.id,
            name: c.name,
            facilityName: c.facility.name,
            hourlyRateCents: c.hourlyRateCents,
          }))}
        />
      )}
    </div>
  );
}
