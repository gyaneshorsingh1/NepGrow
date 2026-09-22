import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import {
  authorize,
  type TenantContext,
} from "@/lib/authorization/context";
import { assignableModuleKeys } from "@/lib/authorization/ability";
import {
  assertCanAssignPermissions,
  assertCanMutateRole,
  assertRoleInBusiness,
} from "@/lib/authorization/guards";
import { logActivity } from "@/server/services/activity";

export async function listAssignablePermissions(ctx: TenantContext) {
  const allowedModules = assignableModuleKeys(ctx.enabledModuleKeys);
  return prisma.permission.findMany({
    where: { moduleKey: { in: allowedModules } },
    orderBy: [{ moduleKey: "asc" }, { key: "asc" }],
  });
}

export async function listBusinessRoles(ctx: TenantContext, search?: string) {
  await authorize(ctx, "view", "roles");

  return prisma.role.findMany({
    where: {
      businessId: ctx.businessId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { key: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      permissions: true,
      _count: { select: { memberships: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function getBusinessRole(ctx: TenantContext, roleId: string) {
  await authorize(ctx, "view", "roles");
  return assertRoleInBusiness(roleId, ctx.businessId);
}

export async function createBusinessRole(
  ctx: TenantContext,
  input: {
    name: string;
    key?: string;
    description?: string;
    permissionIds: string[];
  },
) {
  await authorize(ctx, "create", "roles");
  await assertCanAssignPermissions(ctx, input.permissionIds);

  const key = (input.key && input.key.length >= 2 ? input.key : null) || slugify(input.name);
  if (!key || key.length < 2) {
    throw new AppError("Role key is required", "VALIDATION", 400);
  }
  const existing = await prisma.role.findFirst({
    where: { businessId: ctx.businessId, key },
  });
  if (existing) {
    throw new AppError("A role with this key already exists", "CONFLICT", 409);
  }

  const role = await prisma.$transaction(async (tx) => {
    return tx.role.create({
      data: {
        businessId: ctx.businessId,
        name: input.name,
        key,
        description: input.description,
        isSystem: false,
        permissions: input.permissionIds.length
          ? {
              create: input.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "role.created",
    module: "roles",
    entity: "Role",
    entityId: role.id,
    metadata: {
      name: role.name,
      key: role.key,
      permissionIds: input.permissionIds,
    },
  });

  return role;
}

export async function updateBusinessRole(
  ctx: TenantContext,
  input: {
    id: string;
    name: string;
    description?: string;
    permissionIds: string[];
  },
) {
  await authorize(ctx, "update", "roles");
  const role = await assertRoleInBusiness(input.id, ctx.businessId);
  await assertCanMutateRole(ctx, role, "update");
  await assertCanAssignPermissions(ctx, input.permissionIds);

  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: role.id },
      data: {
        name: input.name,
        description: input.description,
      },
    });
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (input.permissionIds.length) {
      await tx.rolePermission.createMany({
        data: input.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "role.updated",
    module: "roles",
    entity: "Role",
    entityId: role.id,
    metadata: {
      name: input.name,
      permissionIds: input.permissionIds,
    },
  });

  return role.id;
}

export async function deleteBusinessRole(ctx: TenantContext, roleId: string) {
  await authorize(ctx, "delete", "roles");
  const role = await assertRoleInBusiness(roleId, ctx.businessId);
  await assertCanMutateRole(ctx, role, "delete");

  await prisma.role.delete({ where: { id: role.id } });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "role.deleted",
    module: "roles",
    entity: "Role",
    entityId: role.id,
    metadata: { name: role.name, key: role.key },
  });
}
