import { notFound } from "next/navigation";

import { resolveBusinessWebsite } from "@/features/websites/resolve";
import { AppError } from "@/lib/errors";
import { SportsWebsiteLayout } from "@/templates/sports/layout";

type Params = Promise<{ category: string; businessSlug: string }>;

export default async function PublicContactPage({
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

  const { business, content, category: cat } = resolved;

  return (
    <SportsWebsiteLayout
      businessName={business.name}
      categorySlug={cat.domainSlug}
      businessSlug={business.slug}
    >
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Contact
        </h1>
        <div className="mt-8 space-y-4 text-emerald-50/80">
          <p>
            <span className="text-emerald-300">Email: </span>
            {content.contactEmail || business.email}
          </p>
          <p>
            <span className="text-emerald-300">Phone: </span>
            {content.contactPhone || business.phone || "—"}
          </p>
          <p>
            <span className="text-emerald-300">Address: </span>
            {content.address || business.address || "—"}
          </p>
        </div>
      </div>
    </SportsWebsiteLayout>
  );
}
