import { addDays, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

import {
  authorize,
  requireModule,
  type TenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/server/services/activity";
import { postCashbookPayment } from "@/server/services/accounting";

function parseBenefits(raw?: string[] | string | null): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    return raw.map((b) => b.trim()).filter(Boolean);
  }
  return raw
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}

function benefitsFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** Mark ACTIVE memberships past endDate as EXPIRED (tenant-scoped). */
export async function expireStaleMemberships(businessId: string) {
  const now = new Date();
  await prisma.membership.updateMany({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
}

export async function listMembershipProducts(
  ctx: TenantContext,
  opts?: { search?: string; status?: "ACTIVE" | "INACTIVE" },
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");

  return prisma.membershipProduct.findMany({
    where: {
      businessId: ctx.businessId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search
        ? {
            OR: [
              { name: { contains: opts.search } },
              { description: { contains: opts.search } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
      memberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getMembershipProduct(ctx: TenantContext, productId: string) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");
  await expireStaleMemberships(ctx.businessId);

  const product = await prisma.membershipProduct.findFirst({
    where: { id: productId, businessId: ctx.businessId },
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
      memberships: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payment: {
            select: {
              id: true,
              status: true,
              amountCents: true,
              currency: true,
            },
          },
        },
      },
    },
  });
  if (!product) throw new AppError("Plan not found", "NOT_FOUND", 404);

  const activeCount = product.memberships.filter((m) => m.status === "ACTIVE")
    .length;

  return {
    ...product,
    benefits: benefitsFromJson(product.benefits),
    activeCount,
  };
}

export async function createMembershipProduct(
  ctx: TenantContext,
  data: {
    name: string;
    description?: string;
    priceCents: number;
    durationDays: number;
    benefits?: string[] | string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "create", "memberships", "memberships");

  const benefits = parseBenefits(data.benefits);
  const product = await prisma.membershipProduct.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      durationDays: data.durationDays,
      benefits: benefits?.length ? benefits : undefined,
      status: data.status ?? "ACTIVE",
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "membership_plan.created",
    module: "memberships",
    entity: "MembershipProduct",
    entityId: product.id,
    metadata: { name: product.name, priceCents: product.priceCents },
  });

  return product;
}

export async function updateMembershipProduct(
  ctx: TenantContext,
  data: {
    id: string;
    name: string;
    description?: string;
    priceCents: number;
    durationDays: number;
    benefits?: string[] | string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "update", "memberships", "memberships");

  const existing = await prisma.membershipProduct.findFirst({
    where: { id: data.id, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Plan not found", "NOT_FOUND", 404);

  const benefits = parseBenefits(data.benefits);
  const product = await prisma.membershipProduct.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      durationDays: data.durationDays,
      benefits: benefits ?? [],
      ...(data.status ? { status: data.status } : {}),
    },
  });

  const statusChanged =
    data.status && data.status !== existing.status ? data.status : null;

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: statusChanged
      ? statusChanged === "ACTIVE"
        ? "membership_plan.activated"
        : "membership_plan.deactivated"
      : "membership_plan.updated",
    module: "memberships",
    entity: "MembershipProduct",
    entityId: product.id,
    metadata: {
      name: product.name,
      priceCents: product.priceCents,
      status: product.status,
    },
  });

  return product;
}

export async function setMembershipProductStatus(
  ctx: TenantContext,
  productId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "update", "memberships", "memberships");

  const existing = await prisma.membershipProduct.findFirst({
    where: { id: productId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Plan not found", "NOT_FOUND", 404);

  const product = await prisma.membershipProduct.update({
    where: { id: existing.id },
    data: { status },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action:
      status === "ACTIVE"
        ? "membership_plan.activated"
        : "membership_plan.deactivated",
    module: "memberships",
    entity: "MembershipProduct",
    entityId: product.id,
  });

  return product;
}

/**
 * Soft-deactivate preferred. Hard delete only when no membership history.
 */
export async function deleteMembershipProduct(
  ctx: TenantContext,
  productId: string,
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "delete", "memberships", "memberships");

  const existing = await prisma.membershipProduct.findFirst({
    where: { id: productId, businessId: ctx.businessId },
    include: { _count: { select: { memberships: true } } },
  });
  if (!existing) throw new AppError("Plan not found", "NOT_FOUND", 404);

  if (existing._count.memberships > 0) {
    const product = await prisma.membershipProduct.update({
      where: { id: existing.id },
      data: { status: "INACTIVE" },
    });
    await logActivity({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "membership_plan.deactivated",
      module: "memberships",
      entity: "MembershipProduct",
      entityId: product.id,
      metadata: { reason: "has_membership_history" },
    });
    return { id: product.id, deactivated: true as const };
  }

  await prisma.membershipProduct.delete({ where: { id: existing.id } });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "membership_plan.deleted",
    module: "memberships",
    entity: "MembershipProduct",
    entityId: existing.id,
    metadata: { name: existing.name },
  });
  return { id: existing.id, deactivated: false as const };
}

export async function listMemberships(
  ctx: TenantContext,
  opts?: { search?: string; status?: "ACTIVE" | "EXPIRED" | "CANCELLED" },
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");
  await expireStaleMemberships(ctx.businessId);

  return prisma.membership.findMany({
    where: {
      businessId: ctx.businessId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search
        ? {
            OR: [
              { customer: { name: { contains: opts.search } } },
              { product: { name: { contains: opts.search } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, status: true } },
      payment: {
        select: { id: true, status: true, amountCents: true, currency: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getMembership(ctx: TenantContext, membershipId: string) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");
  await expireStaleMemberships(ctx.businessId);

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, businessId: ctx.businessId },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      product: {
        select: { id: true, name: true, status: true, durationDays: true },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountCents: true,
          currency: true,
          method: true,
          reference: true,
          notes: true,
        },
      },
    },
  });
  if (!membership) throw new AppError("Membership not found", "NOT_FOUND", 404);
  return membership;
}

export async function assignMembership(
  ctx: TenantContext,
  data: {
    customerId: string;
    productId: string;
    startDate?: string;
    paymentStatus?: "PENDING" | "COMPLETED";
    paymentMethod?: string;
    cashbookAccountId?: string;
  },
) {
  await requireModule(ctx, "memberships");
  const canAssign =
    ctx.ability.can("assign", "memberships") ||
    ctx.ability.can("create", "memberships") ||
    ctx.isPlatformAdmin;
  if (!canAssign) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  const [customer, product] = await Promise.all([
    prisma.customer.findFirst({
      where: {
        id: data.customerId,
        businessId: ctx.businessId,
        status: "ACTIVE",
      },
    }),
    prisma.membershipProduct.findFirst({
      where: { id: data.productId, businessId: ctx.businessId },
    }),
  ]);
  if (!customer) throw new AppError("Customer not found", "NOT_FOUND", 404);
  if (!product) throw new AppError("Plan not found", "NOT_FOUND", 404);
  if (product.status !== "ACTIVE") {
    throw new AppError(
      "Cannot assign an inactive membership plan",
      "VALIDATION",
      400,
    );
  }

  const start = data.startDate
    ? startOfDay(new Date(data.startDate))
    : startOfDay(new Date());
  if (Number.isNaN(start.getTime())) {
    throw new AppError("Invalid start date", "VALIDATION", 400);
  }
  const end = addDays(start, product.durationDays);
  const priceCents = product.priceCents;
  const paymentStatus = data.paymentStatus ?? "COMPLETED";

  const membership = await prisma.$transaction(async (tx) => {
    const created = await tx.membership.create({
      data: {
        businessId: ctx.businessId,
        customerId: customer.id,
        productId: product.id,
        startDate: start,
        endDate: end,
        priceCents,
        status: "ACTIVE",
      },
    });

    const payment = await tx.payment.create({
      data: {
        businessId: ctx.businessId,
        customerId: customer.id,
        membershipId: created.id,
        amountCents: priceCents,
        currency: ctx.currency,
        method: data.paymentMethod || "cash",
        status: paymentStatus,
        notes: `Membership: ${product.name}`,
      },
    });

    if (paymentStatus === "COMPLETED" && data.cashbookAccountId) {
      await postCashbookPayment(ctx, {
        paymentId: payment.id,
        accountId: data.cashbookAccountId,
        amountCents: priceCents,
        category: "Membership",
        description: `Membership: ${product.name}`,
        tx,
      });
    }

    return created;
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "membership.assigned",
    module: "memberships",
    entity: "Membership",
    entityId: membership.id,
    metadata: {
      customerId: customer.id,
      productId: product.id,
      priceCents,
      paymentStatus,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  });

  return membership;
}

export async function completeMembershipPayment(
  ctx: TenantContext,
  data: { membershipId: string; paymentMethod?: string; cashbookAccountId?: string },
) {
  await requireModule(ctx, "memberships");
  const canPay =
    ctx.ability.can("create", "payments") ||
    ctx.ability.can("update", "memberships") ||
    ctx.ability.can("assign", "memberships") ||
    ctx.isPlatformAdmin;
  if (!canPay) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  const membership = await prisma.membership.findFirst({
    where: { id: data.membershipId, businessId: ctx.businessId },
    include: { payment: true, product: { select: { name: true } } },
  });
  if (!membership) throw new AppError("Membership not found", "NOT_FOUND", 404);
  if (!membership.payment) {
    throw new AppError("No payment record for this membership", "VALIDATION", 400);
  }
  if (membership.payment.status !== "PENDING") {
    throw new AppError(
      "Only pending membership payments can be completed",
      "VALIDATION",
      400,
    );
  }
  const paymentRecord = membership.payment;

  // Full payment only — amount is always the membership snapshot price
  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: "COMPLETED",
        amountCents: membership.priceCents,
        method: data.paymentMethod || paymentRecord.method || "cash",
        notes: paymentRecord.notes || `Membership: ${membership.product.name}`,
      },
    });

    if (data.cashbookAccountId) {
      await postCashbookPayment(ctx, {
        paymentId: updated.id,
        accountId: data.cashbookAccountId,
        amountCents: updated.amountCents,
        category: "Membership",
        description: `Membership: ${membership.product.name}`,
        tx,
      });
    }

    return updated;
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "membership.payment_completed",
    module: "memberships",
    entity: "Payment",
    entityId: payment.id,
    metadata: {
      membershipId: membership.id,
      amountCents: payment.amountCents,
      method: payment.method,
    },
  });

  return payment;
}

export async function cancelMembership(ctx: TenantContext, membershipId: string) {
  await requireModule(ctx, "memberships");
  const canCancel =
    ctx.ability.can("cancel", "memberships") ||
    ctx.ability.can("update", "memberships") ||
    ctx.isPlatformAdmin;
  if (!canCancel) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  const existing = await prisma.membership.findFirst({
    where: { id: membershipId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Membership not found", "NOT_FOUND", 404);
  if (existing.status === "CANCELLED") {
    throw new AppError("Membership is already cancelled", "VALIDATION", 400);
  }

  const membership = await prisma.membership.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "membership.cancelled",
    module: "memberships",
    entity: "Membership",
    entityId: membership.id,
    metadata: {
      customerId: existing.customerId,
      productId: existing.productId,
      priceCents: existing.priceCents,
    },
  });

  return membership;
}

export type MembershipProductListItem = Prisma.MembershipProductGetPayload<{
  include: { _count: { select: { memberships: true } } };
}>;
