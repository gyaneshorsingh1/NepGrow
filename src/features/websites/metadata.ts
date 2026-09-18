import type { Metadata } from "next";

import { resolveBusinessWebsite } from "@/features/websites/resolve";

export async function businessWebsiteMetadata(
  category: string,
  businessSlug: string,
  pageTitle?: string,
): Promise<Metadata> {
  try {
    const { business, website, content } = await resolveBusinessWebsite(
      category,
      businessSlug,
    );
    const baseTitle = website.seoTitle || business.name;
    return {
      title: pageTitle ? `${pageTitle} · ${baseTitle}` : baseTitle,
      description:
        website.seoDescription ||
        content.heroSubheadline ||
        business.description ||
        undefined,
      openGraph: {
        title: pageTitle ? `${pageTitle} · ${baseTitle}` : baseTitle,
        description:
          website.seoDescription ||
          content.heroSubheadline ||
          business.description ||
          undefined,
      },
      robots: website.indexable ? undefined : { index: false, follow: false },
    };
  } catch {
    return { title: pageTitle || "Business" };
  }
}
