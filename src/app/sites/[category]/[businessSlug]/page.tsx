import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveBusinessWebsite } from "@/features/websites/resolve";
import { AppError } from "@/lib/errors";
import { SportsHome } from "@/templates/sports/home";
import { SportsWebsiteLayout } from "@/templates/sports/layout";

type Params = Promise<{ category: string; businessSlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const { category, businessSlug } = await params;
    const { business, website, content } = await resolveBusinessWebsite(
      category,
      businessSlug,
    );
    return {
      title: website.seoTitle || business.name,
      description:
        website.seoDescription ||
        content.heroSubheadline ||
        business.description ||
        undefined,
      robots: website.indexable ? undefined : { index: false, follow: false },
    };
  } catch {
    return { title: "Business" };
  }
}

export default async function BusinessHomePage({
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
      <SportsHome
        content={content}
        businessName={business.name}
        bookHref={`/sites/${cat.domainSlug}/${business.slug}/book`}
      />
    </SportsWebsiteLayout>
  );
}
