import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  defineAbilityFor,
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
};

export async function getEnabledModuleKeys(businessId: string): Promise<string[]> {
  const rows = await prisma.businessModule.findMany({
    where: { businessId, enabled: true },
    include: { module: true },
  });
  return rows.map((r) => r.module.key);
}

export async function getPermissionKeysForMembership(
  membershipId: string,
): Promise<string[]> {
  const roles = await prisma.membershipRole.findMany({
    where: { membershipId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const mr of roles) {
    for (const rp of mr.role.permissions) {
      keys.add(rp.permission.key);
    }
  }
  return [...keys];
}

export async function resolveTenantContext(
  businessId?: string | null,
): Promise<TenantContext> {
  const session = await requireSession();
  const userId = session.user.id;
  const isPlatformAdmin = Boolean(
    (session.user as { isPlatformAdmin?: boolean }).isPlatformAdmin,
  );

  let resolvedBusinessId =
    businessId ??
    (session.session as { activeBusinessId?: string | null }).activeBusinessId ??
    null;

  if (!resolvedBusinessId && !isPlatformAdmin) {
    const membership = await prisma.businessMembership.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    resolvedBusinessId = membership?.businessId ?? null;
  }

  if (!resolvedBusinessId) {
    throw new AppError("No active business context", "FORBIDDEN", 403);
  }

  const business = await prisma.business.findUnique({
    where: { id: resolvedBusinessId },
    include: { subscription: true },
  });

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

  let permissionKeys: string[] = [];
  if (isPlatformAdmin) {
    permissionKeys = ["manage.all"];
  } else {
    const membership = await prisma.businessMembership.findUnique({
      where: {
        userId_businessId: { userId, businessId: resolvedBusinessId },
      },
    });
    if (!membership || membership.status !== "ACTIVE") {
      throw new AppError("Not a member of this business", "FORBIDDEN", 403);
    }
    permissionKeys = await getPermissionKeysForMembership(membership.id);
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
  };
}

export async function authorize(
  ctx: TenantContext,
  action: Parameters<AppAbility["can"]>[0],
  subject: Parameters<AppAbility["can"]>[1],
  moduleKey?: string,
) {
  if (moduleKey) {
    const enabled =
      moduleKey === "dashboard" ||
      moduleKey === "settings" ||
      ctx.enabledModuleKeys.includes(moduleKey);
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
