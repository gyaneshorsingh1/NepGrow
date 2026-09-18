import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type WebsiteContent = {
  heroHeadline?: string;
  heroSubheadline?: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  [key: string]: unknown;
};

export async function resolveBusinessWebsite(
  categoryDomainSlug: string,
  businessSlug: string,
) {
  const category = await prisma.businessCategory.findFirst({
    where: {
      OR: [{ domainSlug: categoryDomainSlug }, { slug: categoryDomainSlug }],
      status: "ACTIVE",
    },
  });

  if (!category) {
    throw new AppError("Category not found", "NOT_FOUND", 404);
  }

  const business = await prisma.business.findFirst({
    where: {
      slug: businessSlug,
      categoryId: category.id,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: {
      website: {
        include: { template: true, theme: true },
      },
      facilities: {
        where: { status: "ACTIVE" },
        include: { courts: { where: { status: "ACTIVE" } } },
        orderBy: { name: "asc" },
      },
      membershipProducts: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!business || !business.website || !business.website.published) {
    throw new AppError("Business website not found", "NOT_FOUND", 404);
  }

  const content = (business.website.content ?? {}) as WebsiteContent;

  return { category, business, website: business.website, content };
}
