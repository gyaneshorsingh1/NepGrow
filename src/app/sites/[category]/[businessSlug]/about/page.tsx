import { notFound } from "next/navigation";

import { resolveBusinessWebsite } from "@/features/websites/resolve";
import { AppError } from "@/lib/errors";
import { SportsWebsiteLayout } from "@/templates/sports/layout";

type Params = Promise<{ category: string; businessSlug: string }>;

export default async function PublicAboutPage({
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
          About {business.name}
        </h1>
        <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-emerald-50/80">
          {content.about ||
            business.description ||
            `${business.name} is on NepGrow.`}
        </p>
      </div>
    </SportsWebsiteLayout>
  );
}
