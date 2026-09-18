import { notFound } from "next/navigation";

import { resolveBusinessWebsite } from "@/features/websites/resolve";
import { AppError } from "@/lib/errors";
import { SportsWebsiteLayout } from "@/templates/sports/layout";

import { PublicBookingForm } from "./public-booking-form";

type Params = Promise<{ category: string; businessSlug: string }>;

export const metadata = { title: "Book a court" };

export default async function PublicBookPage({
  params,
}: {
  params: Params;
}) {
  const { category, businessSlug } = await params;
  let resolved;
  try {
    resolved = await resolveBusinessWebsite(category, businessSlug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const { business, category: cat } = resolved;
  const courts = business.facilities.flatMap((f) =>
    f.courts.map((c) => ({
      id: c.id,
      label: `${f.name} · ${c.name}`,
    })),
  );

  return (
    <SportsWebsiteLayout
      businessName={business.name}
      categorySlug={cat.domainSlug}
      businessSlug={business.slug}
    >
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-white">
          Book a court
        </h1>
        <p className="mb-8 text-center text-emerald-50/70">
          Choose a court and time — we will confirm your booking.
        </p>
        <PublicBookingForm
          businessId={business.id}
          categorySlug={cat.domainSlug}
          businessSlug={business.slug}
          courts={courts}
        />
      </div>
    </SportsWebsiteLayout>
  );
}
