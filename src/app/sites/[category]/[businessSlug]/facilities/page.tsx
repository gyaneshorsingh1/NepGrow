import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { businessWebsiteMetadata } from "@/features/websites/metadata";
import { resolveBusinessWebsite } from "@/features/websites/resolve";
import { AppError } from "@/lib/errors";
import { formatMoney } from "@/lib/utils";
import { SportsWebsiteLayout } from "@/templates/sports/layout";

type Params = Promise<{ category: string; businessSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { category, businessSlug } = await params;
  return businessWebsiteMetadata(category, businessSlug, "Facilities");
}

export default async function PublicFacilitiesPage({
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

  return (
    <SportsWebsiteLayout
      businessName={business.name}
      categorySlug={cat.domainSlug}
      businessSlug={business.slug}
    >
      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Facilities
        </h1>
        <p className="mt-2 text-emerald-50/70">
          Courts and spaces available for booking.
        </p>
        <div className="mt-8 space-y-6">
          {business.facilities.map((facility) => (
            <div
              key={facility.id}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-5"
            >
              <h2 className="text-xl font-medium text-emerald-200">
                {facility.name}
              </h2>
              <p className="mt-1 text-sm text-emerald-50/60">{facility.sport}</p>
              {facility.description ? (
                <p className="mt-3 text-sm text-emerald-50/80">
                  {facility.description}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2 text-sm text-emerald-50/80">
                {facility.courts.map((court) => (
                  <li key={court.id} className="flex justify-between gap-4">
                    <span>{court.name}</span>
                    <span>
                      {formatMoney(court.hourlyRateCents, business.currency)} / hr
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SportsWebsiteLayout>
  );
}
