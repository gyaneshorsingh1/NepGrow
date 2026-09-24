import type { TenantContext } from "@/lib/authorization/context";
import { authorize } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/server/services/activity";

export async function getBusinessProfile(ctx: TenantContext) {
  await authorize(ctx, "view", "settings", "settings");

  const business = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    include: {
      category: { select: { id: true, name: true, domainSlug: true } },
      subscription: { include: { plan: { select: { name: true } } } },
    },
  });
  if (!business) throw new AppError("Business not found", "NOT_FOUND", 404);
  return business;
}

export async function updateBusinessProfile(
  ctx: TenantContext,
  data: {
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    description?: string;
    timezone: string;
  },
) {
  await authorize(ctx, "update", "settings", "settings");

  const existing = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    select: { id: true, slug: true },
  });
  if (!existing) throw new AppError("Business not found", "NOT_FOUND", 404);

  const slug = slugify(data.slug);
  if (slug.length < 2) {
    throw new AppError(
      "Slug must be at least 2 characters",
      "VALIDATION",
      400,
    );
  }

  if (slug !== existing.slug) {
    // Portal and public URLs key off slug alone, so require global uniqueness.
    const taken = await prisma.business.findFirst({
      where: { slug, NOT: { id: ctx.businessId } },
      select: { id: true },
    });
    if (taken) {
      throw new AppError(
        "This slug is already in use. Choose a different one.",
        "CONFLICT",
        409,
      );
    }
  }

  const business = await prisma.business.update({
    where: { id: ctx.businessId },
    data: {
      name: data.name.trim(),
      slug,
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      description: data.description?.trim() || null,
      timezone: data.timezone.trim(),
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "business.updated",
    module: "settings",
    entity: "Business",
    entityId: business.id,
    metadata: { name: business.name, slug: business.slug },
  });

  return business;
}
