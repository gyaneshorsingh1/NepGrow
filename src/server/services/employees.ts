import { auth } from "@/lib/auth/auth";
import {
  authorize,
  type TenantContext,
} from "@/lib/authorization/context";
import {
  assertCanAssignPermissions,
  assertCanAssignRoles,
  assertMembershipInBusiness,
  assertNotLastOwner,
  assertNotSelfDemoteLastOwner,
} from "@/lib/authorization/guards";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/server/services/activity";

export async function listEmployees(
  ctx: TenantContext,
  opts?: { search?: string; status?: "ACTIVE" | "DISABLED" },
) {
  await authorize(ctx, "view", "users");

  return prisma.businessMembership.findMany({
    where: {
      businessId: ctx.businessId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search
        ? {
            user: {
              OR: [
                { name: { contains: opts.search } },
                { email: { contains: opts.search } },
              ],
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      roles: { include: { role: { select: { id: true, name: true, key: true } } } },
      permissions: {
        where: { effect: "ALLOW" },
        select: { permissionId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getEmployee(ctx: TenantContext, membershipId: string) {
  await authorize(ctx, "view", "users");
  return assertMembershipInBusiness(membershipId, ctx.businessId);
}

export async function createEmployee(
  ctx: TenantContext,
  input: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    permissionIds?: string[];
    status?: "ACTIVE" | "DISABLED";
  },
) {
  await authorize(ctx, "create", "users");
  await assertCanAssignRoles(ctx, [input.roleId]);
  const directIds = input.permissionIds ?? [];
  await assertCanAssignPermissions(ctx, directIds);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("Email already in use", "CONFLICT", 409);
  }

  const signUp = await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
    },
  });
  if (!signUp?.user) {
    throw new AppError("Failed to create user", "INTERNAL", 500);
  }

  const status = input.status ?? "ACTIVE";

  const membership = await prisma.$transaction(async (tx) => {
    if (status === "DISABLED") {
      await tx.user.update({
        where: { id: signUp.user.id },
        data: { status: "DISABLED" },
      });
    }
    const m = await tx.businessMembership.create({
      data: {
        userId: signUp.user.id,
        businessId: ctx.businessId,
        status,
        roles: { create: [{ roleId: input.roleId }] },
        permissions: directIds.length
          ? {
              create: directIds.map((permissionId) => ({
                permissionId,
                effect: "ALLOW",
              })),
            }
          : undefined,
      },
    });
    return m;
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "employee.created",
    module: "users",
    entity: "BusinessMembership",
    entityId: membership.id,
    metadata: {
      targetUserId: signUp.user.id,
      roleId: input.roleId,
      permissionIds: directIds,
      status,
    },
  });

  return membership;
}

export async function updateEmployeeRoles(
  ctx: TenantContext,
  input: { membershipId: string; roleIds: string[] },
) {
  await authorize(ctx, "update", "users");
  const membership = await assertMembershipInBusiness(
    input.membershipId,
    ctx.businessId,
  );
  const roleIds = await assertCanAssignRoles(ctx, input.roleIds);
  await assertNotLastOwner(ctx.businessId, membership.id, {
    nextRoleIds: roleIds,
  });
  await assertNotSelfDemoteLastOwner(ctx, membership.id, roleIds);

  await prisma.$transaction(async (tx) => {
    await tx.membershipRole.deleteMany({
      where: { membershipId: membership.id },
    });
    await tx.membershipRole.createMany({
      data: roleIds.map((roleId) => ({
        membershipId: membership.id,
        roleId,
      })),
    });
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "role.assigned",
    module: "users",
    entity: "BusinessMembership",
    entityId: membership.id,
    metadata: {
      targetUserId: membership.userId,
      roleIds,
    },
  });
}

export async function setEmployeeDirectPermissions(
  ctx: TenantContext,
  input: { membershipId: string; permissionIds: string[] },
) {
  const canManage =
    ctx.ability.can("manage", "permissions") ||
    ctx.ability.can("update", "users") ||
    ctx.isPlatformAdmin;
  if (!canManage) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  const membership = await assertMembershipInBusiness(
    input.membershipId,
    ctx.businessId,
  );
  await assertCanAssignPermissions(ctx, input.permissionIds);

  await prisma.$transaction(async (tx) => {
    await tx.membershipPermission.deleteMany({
      where: { membershipId: membership.id },
    });
    if (input.permissionIds.length) {
      await tx.membershipPermission.createMany({
        data: input.permissionIds.map((permissionId) => ({
          membershipId: membership.id,
          permissionId,
          effect: "ALLOW" as const,
        })),
      });
    }
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "permission.assigned",
    module: "permissions",
    entity: "BusinessMembership",
    entityId: membership.id,
    metadata: {
      targetUserId: membership.userId,
      permissionIds: input.permissionIds,
    },
  });
}

export async function setEmployeeStatus(
  ctx: TenantContext,
  input: { membershipId: string; status: "ACTIVE" | "DISABLED" },
) {
  const canDisable =
    ctx.ability.can("disable", "users") ||
    ctx.ability.can("update", "users") ||
    ctx.isPlatformAdmin;
  if (!canDisable) {
    throw new AppError("Permission denied", "FORBIDDEN", 403);
  }

  const membership = await assertMembershipInBusiness(
    input.membershipId,
    ctx.businessId,
  );

  if (input.status === "DISABLED") {
    if (membership.userId === ctx.userId) {
      throw new AppError("Cannot disable your own account", "FORBIDDEN", 403);
    }
    await assertNotLastOwner(ctx.businessId, membership.id, {
      disableMembership: true,
    });
  }

  await prisma.$transaction([
    prisma.businessMembership.update({
      where: { id: membership.id },
      data: { status: input.status },
    }),
    prisma.user.update({
      where: { id: membership.userId },
      data: { status: input.status },
    }),
  ]);

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action:
      input.status === "DISABLED" ? "employee.disabled" : "employee.enabled",
    module: "users",
    entity: "BusinessMembership",
    entityId: membership.id,
    metadata: { targetUserId: membership.userId, status: input.status },
  });
}

export async function listAssignableRoles(ctx: TenantContext) {
  return prisma.role.findMany({
    where: { businessId: ctx.businessId },
    select: { id: true, name: true, key: true, isSystem: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}
