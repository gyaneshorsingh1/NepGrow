import { cache } from "react";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  defineAbilityFor,
  isModuleExempt,
  type AppAbility,
} from "@/lib/authorization/ability";
import { requireSession } from "@/lib/auth/session";

export type TenantContext = {
  userId: string;
  businessId: string;
  isPlatformAdmin: boolean;
  permissionKeys: string[];
  enabledModuleKeys: string[];
  ability: AppAbility;
  subscriptionActive: boolean;
  businessName?: string;
  /** ISO 4217 currency code for this business */
  currency: string;
  currencyDecimals: number;
};

export async function getEnabledModuleKeys(businessId: string): Promise<string[]> {
  const rows = await prisma.businessModule.findMany({
    where: { businessId, enabled: true },
    select: { module: { select: { key: true } } },
  });
  return rows.map((r) => r.module.key);
}

export async function getPermissionKeysForMembership(
  membershipId: string,
): Promise<string[]> {
  const membership = await prisma.businessMembership.findUnique({
    where: { id: membershipId },
    select: {
      roles: {
        select: {
          role: {
            select: {
              permissions: {
                select: { permission: { select: { key: true } } },
              },
            },
          },
        },
      },
      permissions: {
        where: { effect: "ALLOW" },
        select: { permission: { select: { key: true } } },
      },
    },
  });

  const keys = new Set<string>();
  for (const mr of membership?.roles ?? []) {
    for (const rp of mr.role.permissions) {
      keys.add(rp.permission.key);
    }
  }
  for (const row of membership?.permissions ?? []) {
    keys.add(row.permission.key);
  }
  return [...keys];
}

/**
 * Request-scoped tenant context. Layout + page share one resolution.
 */
export const resolveTenantContext = cache(
  async (businessId?: string | null): Promise<TenantContext> => {
    const session = await requireSession();
    const userId = session.user.id;
    const isPlatformAdmin = Boolean(session.user.isPlatformAdmin);

    let resolvedBusinessId =
      businessId ?? session.session.activeBusinessId ?? null;

    let membershipId: string | null = null;

    if (!resolvedBusinessId && !isPlatformAdmin) {
      const membership = await prisma.businessMembership.findFirst({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true, businessId: true },
      });
      resolvedBusinessId = membership?.businessId ?? null;
      membershipId = membership?.id ?? null;
    }

    if (!resolvedBusinessId) {
      throw new AppError("No active business context", "FORBIDDEN", 403);
    }

    const [business, membership] = await Promise.all([
      prisma.business.findUnique({
        where: { id: resolvedBusinessId },
        select: {
          id: true,
          name: true,
          status: true,
          currency: true,
          subscription: { select: { status: true } },
        },
      }),
      isPlatformAdmin
        ? Promise.resolve(null)
        : membershipId
          ? prisma.businessMembership.findUnique({
              where: { id: membershipId },
              select: { id: true, status: true },
            })
          : prisma.businessMembership.findUnique({
              where: {
                userId_businessId: {
                  userId,
                  businessId: resolvedBusinessId,
                },
              },
              select: { id: true, status: true },
            }),
    ]);

    if (!business) {
      throw new AppError("Business not found", "NOT_FOUND", 404);
    }

    if (business.status === "SUSPENDED" && !isPlatformAdmin) {
      throw new AppError("Business is suspended", "FORBIDDEN", 403);
    }

    const subscriptionActive =
      !business.subscription ||
      business.subscription.status === "ACTIVE" ||
      business.subscription.status === "TRIAL";

    if (!subscriptionActive && !isPlatformAdmin) {
      throw new AppError("Subscription is not active", "FORBIDDEN", 403);
    }

    const currencyCode = business.currency || "NPR";
    const currencyRow = await prisma.currency.findUnique({
      where: { code: currencyCode },
      select: { decimals: true },
    });
    const currencyDecimals = currencyRow?.decimals ?? 2;

    let permissionKeys: string[] = [];
    if (isPlatformAdmin) {
      permissionKeys = ["manage.all"];
    } else {
      if (!membership || membership.status !== "ACTIVE") {
        throw new AppError("Not a member of this business", "FORBIDDEN", 403);
      }
      const [perms, modules] = await Promise.all([
        getPermissionKeysForMembership(membership.id),
        getEnabledModuleKeys(resolvedBusinessId),
      ]);
      permissionKeys = perms;
      const ability = defineAbilityFor({
        isPlatformAdmin,
        permissionKeys,
        enabledModuleKeys: modules,
      });
      return {
        userId,
        businessId: resolvedBusinessId,
        isPlatformAdmin,
        permissionKeys,
        enabledModuleKeys: modules,
        ability,
        subscriptionActive,
        businessName: business.name,
        currency: currencyCode,
        currencyDecimals,
      };
    }

    const enabledModuleKeys = await getEnabledModuleKeys(resolvedBusinessId);
    const ability = defineAbilityFor({
      isPlatformAdmin,
      permissionKeys,
      enabledModuleKeys,
    });

    return {
      userId,
      businessId: resolvedBusinessId,
      isPlatformAdmin,
      permissionKeys,
      enabledModuleKeys,
      ability,
      subscriptionActive,
      businessName: business.name,
      currency: currencyCode,
      currencyDecimals,
    };
  },
);

export async function authorize(
  ctx: TenantContext,
  action: Parameters<AppAbility["can"]>[0],
  subject: Parameters<AppAbility["can"]>[1],
  moduleKey?: string,
) {
  if (moduleKey) {
    const enabled =
      isModuleExempt(moduleKey) || ctx.enabledModuleKeys.includes(moduleKey);
    if (!enabled && !ctx.isPlatformAdmin) {
      throw new AppError(`Module "${moduleKey}" is not enabled`, "FORBIDDEN", 403);
    }
  }

  if (!ctx.ability.can(action, subject)) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }
}

export async function requireModule(ctx: TenantContext, moduleKey: string) {
  if (ctx.isPlatformAdmin) return;
  if (!ctx.enabledModuleKeys.includes(moduleKey)) {
    throw new AppError(`Module "${moduleKey}" is not enabled`, "FORBIDDEN", 403);
  }
}
