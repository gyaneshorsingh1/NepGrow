import type { TenantContext } from "@/lib/authorization/context";
import { authorize } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
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
    select: { id: true },
  });
  if (!existing) throw new AppError("Business not found", "NOT_FOUND", 404);

  const business = await prisma.business.update({
    where: { id: ctx.businessId },
    data: {
      name: data.name.trim(),
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
    metadata: { name: business.name },
  });

  return business;
}
