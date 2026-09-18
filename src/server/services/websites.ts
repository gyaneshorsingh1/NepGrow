import { authorize, type TenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import type { UpdateWebsiteContentInput } from "@/lib/validation/schemas";
import { logActivity } from "@/server/services/activity";

export async function getTenantWebsite(ctx: TenantContext) {
  await authorize(ctx, "view", "settings", "settings");

  const website = await prisma.website.findUnique({
    where: { businessId: ctx.businessId },
  });

  if (!website) {
    throw new AppError("Website not found", "NOT_FOUND", 404);
  }

  return website;
}

export async function updateTenantWebsiteContent(
  ctx: TenantContext,
  input: UpdateWebsiteContentInput,
) {
  await authorize(ctx, "update", "settings", "settings");

  const existing = await prisma.website.findUnique({
    where: { businessId: ctx.businessId },
  });

  if (!existing) {
    throw new AppError("Website not found", "NOT_FOUND", 404);
  }

  const prev =
    existing.content &&
    typeof existing.content === "object" &&
    !Array.isArray(existing.content)
      ? (existing.content as Record<string, unknown>)
      : {};

  const content = {
    ...prev,
    heroHeadline: input.heroHeadline,
    heroSubheadline: input.heroSubheadline,
    about: input.about,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    address: input.address,
  };

  const website = await prisma.website.update({
    where: { businessId: ctx.businessId },
    data: {
      content,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      indexable: input.indexable,
      published: input.published,
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "website.updated",
    module: "settings",
    entity: "Website",
    entityId: website.id,
    metadata: {
      published: website.published,
      indexable: website.indexable,
    },
  });

  return website;
}
