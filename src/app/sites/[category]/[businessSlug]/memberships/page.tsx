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
  return businessWebsiteMetadata(category, businessSlug, "Memberships");
}

export default async function PublicMembershipsPage({
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
          Memberships
        </h1>
        <p className="mt-2 text-emerald-50/70">
          Join a membership and play more often.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {business.membershipProducts.length === 0 ? (
            <p className="text-emerald-50/60">No memberships published yet.</p>
          ) : (
            business.membershipProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-5"
              >
                <h2 className="text-xl font-medium text-emerald-200">
                  {product.name}
                </h2>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatMoney(product.priceCents, business.currency)}
                </p>
                <p className="mt-1 text-sm text-emerald-50/60">
                  {product.durationDays} days
                </p>
                {product.description ? (
                  <p className="mt-3 text-sm text-emerald-50/80">
                    {product.description}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </SportsWebsiteLayout>
  );
}
