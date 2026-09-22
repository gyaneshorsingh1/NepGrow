import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { TenantContext } from "@/lib/authorization/context";
import { assignableModuleKeys, actorCanGrantPermission } from "@/lib/authorization/ability";

export const OWNER_ROLE_KEY = "owner";

export async function assertRoleInBusiness(
  roleId: string,
  businessId: string,
) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, businessId },
    include: {
      _count: { select: { memberships: true } },
      permissions: {
        select: { permission: { select: { id: true, key: true } } },
      },
    },
  });
  if (!role) {
    throw new AppError("Role not found in this business", "NOT_FOUND", 404);
  }
  return role;
}

export async function assertMembershipInBusiness(
  membershipId: string,
  businessId: string,
) {
  const membership = await prisma.businessMembership.findFirst({
    where: { id: membershipId, businessId },
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      roles: {
        include: {
          role: {
            select: {
              id: true,
              key: true,
              name: true,
              isSystem: true,
              permissions: {
                select: {
                  permission: {
                    select: { id: true, key: true, name: true, moduleKey: true },
                  },
                },
              },
            },
          },
        },
      },
      permissions: {
        where: { effect: "ALLOW" },
        include: {
          permission: {
            select: { id: true, key: true, name: true, moduleKey: true },
          },
        },
      },
    },
  });
  if (!membership) {
    throw new AppError("Employee not found in this business", "NOT_FOUND", 404);
  }
  return membership;
}

export async function assertPermissionsExist(permissionIds: string[]) {
  if (!permissionIds.length) return [];
  const unique = [...new Set(permissionIds)];
  const permissions = await prisma.permission.findMany({
    where: { id: { in: unique } },
  });
  if (permissions.length !== unique.length) {
    throw new AppError("One or more permissions are invalid", "VALIDATION", 400);
  }
  return permissions;
}

/** Actor may assign permissions for enabled modules they have access to. */
export async function assertCanAssignPermissions(
  ctx: TenantContext,
  permissionIds: string[],
) {
  const permissions = await assertPermissionsExist(permissionIds);

  if (!ctx.isPlatformAdmin) {
    const allowedModules = new Set(assignableModuleKeys(ctx.enabledModuleKeys));
    const outOfPlan = permissions.filter((p) => !allowedModules.has(p.moduleKey));
    if (outOfPlan.length) {
      throw new AppError(
        "Cannot assign permissions for modules not enabled on this business",
        "FORBIDDEN",
        403,
      );
    }
  }

  if (ctx.isPlatformAdmin || ctx.permissionKeys.includes("manage.all")) {
    return permissions;
  }

  const forbidden = permissions.filter(
    (p) =>
      !actorCanGrantPermission(
        { permissionKeys: ctx.permissionKeys, isPlatformAdmin: false },
        p,
      ),
  );
  if (forbidden.length) {
    throw new AppError(
      "Cannot assign permissions for modules you do not have access to",
      "FORBIDDEN",
      403,
    );
  }
  return permissions;
}

/** Ensure every role belongs to the business and its perms ⊆ actor keys. */
export async function assertCanAssignRoles(
  ctx: TenantContext,
  roleIds: string[],
) {
  const unique = [...new Set(roleIds.filter(Boolean))];
  for (const roleId of unique) {
    const role = await assertRoleInBusiness(roleId, ctx.businessId);
    await assertCanAssignPermissions(
      ctx,
      role.permissions.map((p) => p.permission.id),
    );
  }
  return unique;
}

export function isOwnerRole(role: { key: string; isSystem: boolean }) {
  return role.isSystem && role.key === OWNER_ROLE_KEY;
}

export async function membershipHasOwnerRole(membershipId: string) {
  const row = await prisma.membershipRole.findFirst({
    where: {
      membershipId,
      role: { key: OWNER_ROLE_KEY, isSystem: true },
    },
  });
  return Boolean(row);
}

export async function actorIsBusinessOwner(ctx: TenantContext) {
  if (ctx.isPlatformAdmin) return true;
  const membership = await prisma.businessMembership.findUnique({
    where: {
      userId_businessId: {
        userId: ctx.userId,
        businessId: ctx.businessId,
      },
    },
    select: { id: true },
  });
  if (!membership) return false;
  return membershipHasOwnerRole(membership.id);
}

export async function countActiveOwners(businessId: string) {
  return prisma.businessMembership.count({
    where: {
      businessId,
      status: "ACTIVE",
      roles: {
        some: {
          role: { businessId, key: OWNER_ROLE_KEY, isSystem: true },
        },
      },
    },
  });
}

export async function assertCanMutateRole(
  ctx: TenantContext,
  role: {
    id: string;
    key: string;
    isSystem: boolean;
    _count?: { memberships: number };
  },
  operation: "update" | "delete",
) {
  if (isOwnerRole(role)) {
    if (operation === "delete") {
      throw new AppError("Cannot delete the Owner role", "FORBIDDEN", 403);
    }
    const isOwner = await actorIsBusinessOwner(ctx);
    if (!isOwner) {
      throw new AppError(
        "Only an Owner can modify the Owner role",
        "FORBIDDEN",
        403,
      );
    }
  } else if (role.isSystem && operation === "delete") {
    throw new AppError("Cannot delete a system role", "FORBIDDEN", 403);
  }

  if (operation === "delete") {
    const memberCount =
      role._count?.memberships ??
      (await prisma.membershipRole.count({ where: { roleId: role.id } }));
    if (memberCount > 0) {
      throw new AppError(
        "Cannot delete a role that is still assigned to users",
        "CONFLICT",
        409,
      );
    }
  }
}

export async function assertNotLastOwner(
  businessId: string,
  membershipId: string,
  next: {
    disableMembership?: boolean;
    nextRoleIds?: string[];
  },
) {
  const hasOwner = await membershipHasOwnerRole(membershipId);
  if (!hasOwner) return;

  const owners = await countActiveOwners(businessId);
  if (owners > 1) return;

  if (next.disableMembership) {
    throw new AppError(
      "Cannot disable the last Owner of this business",
      "FORBIDDEN",
      403,
    );
  }

  if (next.nextRoleIds) {
    const stillOwner = await prisma.role.count({
      where: {
        id: { in: next.nextRoleIds },
        businessId,
        key: OWNER_ROLE_KEY,
        isSystem: true,
      },
    });
    if (!stillOwner) {
      throw new AppError(
        "Cannot remove the Owner role from the last Owner",
        "FORBIDDEN",
        403,
      );
    }
  }
}

export async function assertNotSelfDemoteLastOwner(
  ctx: TenantContext,
  membershipId: string,
  nextRoleIds: string[],
) {
  const membership = await prisma.businessMembership.findFirst({
    where: { id: membershipId, businessId: ctx.businessId },
    select: { userId: true },
  });
  if (!membership || membership.userId !== ctx.userId) return;

  await assertNotLastOwner(ctx.businessId, membershipId, { nextRoleIds });
}
