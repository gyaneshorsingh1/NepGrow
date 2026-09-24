import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import type { CreateClientInput } from "@/lib/validation/schemas";
import { logActivity } from "@/server/services/activity";

export async function createClient(
  input: CreateClientInput,
  actorUserId: string,
) {
  const category = await prisma.businessCategory.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) throw new AppError("Category not found", "NOT_FOUND", 404);

  let subcategoryId: string | null = null;
  if (input.subcategoryId) {
    const subcategory = await prisma.businessSubcategory.findFirst({
      where: {
        id: input.subcategoryId,
        categoryId: input.categoryId,
        status: "ACTIVE",
      },
    });
    if (!subcategory) {
      throw new AppError(
        "Subcategory not found for this category",
        "VALIDATION",
        400,
      );
    }
    subcategoryId = subcategory.id;
  }

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId },
    include: { planModules: true },
  });
  if (!plan) throw new AppError("Plan not found", "NOT_FOUND", 404);

  const baseSlug = slugify(input.businessName);
  let slug = baseSlug;
  let n = 1;
  while (
    await prisma.business.findFirst({
      where: { categoryId: input.categoryId, slug },
    })
  ) {
    slug = `${baseSlug}-${n++}`;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.loginEmail },
  });
  if (existingUser) {
    throw new AppError("Login email already in use", "CONFLICT", 409);
  }

  const template = await prisma.websiteTemplate.findFirst({
    where: {
      OR: [{ categoryId: input.categoryId }, { key: "sports-default" }],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!template) {
    throw new AppError("Website template not found", "NOT_FOUND", 404);
  }

  const theme = await prisma.websiteTheme.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const moduleIds =
    input.moduleIds.length > 0
      ? input.moduleIds
      : plan.planModules.map((pm) => pm.moduleId);

  const signUp = await auth.api.signUpEmail({
    body: {
      email: input.loginEmail,
      password: input.password,
      name: input.loginName,
    },
  });

  if (!signUp?.user) {
    throw new AppError("Failed to create owner user", "INTERNAL", 500);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.businessName,
          slug,
          email: input.email,
          phone: input.phone,
          address: input.address,
          description: input.description,
          categoryId: input.categoryId,
          subcategoryId,
          status: input.status ?? "ACTIVE",
          currency: (input.currency ?? "NPR").toUpperCase(),
        },
      });

      if (input.businessModels.length) {
        await tx.businessFeature.createMany({
          data: input.businessModels.map((key) => ({
            businessId: business.id,
            key,
            enabled: true,
          })),
        });
      }

      const ownerTemplate = await tx.role.findFirst({
        where: { isTemplate: true, key: "owner", businessId: null },
        include: { permissions: true },
      });

      const ownerRole = await tx.role.create({
        data: {
          businessId: business.id,
          name: "Owner",
          key: "owner",
          isSystem: true,
          description: "Full access to the business",
          permissions: ownerTemplate
            ? {
                create: ownerTemplate.permissions.map((p) => ({
                  permissionId: p.permissionId,
                })),
              }
            : undefined,
        },
      });

      const receptionistTemplate = await tx.role.findFirst({
        where: { isTemplate: true, key: "receptionist", businessId: null },
        include: { permissions: true },
      });
      if (receptionistTemplate) {
        await tx.role.create({
          data: {
            businessId: business.id,
            name: "Receptionist",
            key: "receptionist",
            isSystem: false,
            description: receptionistTemplate.description,
            permissions: {
              create: receptionistTemplate.permissions.map((p) => ({
                permissionId: p.permissionId,
              })),
            },
          },
        });
      }

      const membership = await tx.businessMembership.create({
        data: {
          userId: signUp.user.id,
          businessId: business.id,
          status: "ACTIVE",
          roles: {
            create: [{ roleId: ownerRole.id }],
          },
        },
      });

      await tx.subscription.create({
        data: {
          businessId: business.id,
          planId: input.planId,
          status: "ACTIVE",
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
      });

      if (moduleIds.length) {
        await tx.businessModule.createMany({
          data: moduleIds.map((moduleId) => ({
            businessId: business.id,
            moduleId,
            enabled: true,
            source: input.moduleIds.length ? "OVERRIDE" : "PLAN",
          })),
        });
      }

      await tx.website.create({
        data: {
          businessId: business.id,
          templateId: template.id,
          themeId: theme?.id,
          seoTitle: input.businessName,
          seoDescription: input.description ?? `${input.businessName} on NepGrow`,
          content: {
            heroHeadline: input.businessName,
            heroSubheadline:
              input.description ?? "Book facilities and grow with NepGrow.",
            about: input.description ?? "",
            contactEmail: input.email,
            contactPhone: input.phone ?? "",
            address: input.address ?? "",
          },
        },
      });

      return { business, membership, ownerRole };
    });

    await logActivity({
      businessId: result.business.id,
      userId: actorUserId,
      action: "client.created",
      module: "clients",
      entity: "Business",
      entityId: result.business.id,
      metadata: { slug, planId: input.planId },
    });

    return result;
  } catch (error) {
    await prisma.user.delete({ where: { id: signUp.user.id } }).catch(() => undefined);
    throw error;
  }
}

export async function listClients(params: {
  search?: string;
  categoryId?: string;
  planId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where = {
    AND: [
      params.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { email: { contains: params.search } },
              { slug: { contains: params.search } },
            ],
          }
        : {},
      params.categoryId ? { categoryId: params.categoryId } : {},
      params.status ? { status: params.status as "ACTIVE" } : {},
      params.planId ? { subscription: { planId: params.planId } } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        category: true,
        subscription: { include: { plan: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.business.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function setClientStatus(
  businessId: string,
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED",
  actorUserId: string,
) {
  const business = await prisma.business.update({
    where: { id: businessId },
    data: { status },
  });
  await logActivity({
    businessId,
    userId: actorUserId,
    action: status === "SUSPENDED" ? "client.suspended" : "client.updated",
    module: "clients",
    entity: "Business",
    entityId: businessId,
    metadata: { status },
  });
  return business;
}

export async function updateClientProfile(
  input: {
    businessId: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    description?: string;
    status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED";
  },
  actorUserId: string,
) {
  const business = await prisma.business.update({
    where: { id: input.businessId },
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      description: input.description,
      status: input.status,
    },
  });
  await logActivity({
    businessId: input.businessId,
    userId: actorUserId,
    action: "client.updated",
    module: "clients",
    entity: "Business",
    entityId: input.businessId,
  });
  return business;
}

export async function changeClientPlan(
  businessId: string,
  planId: string,
  actorUserId: string,
) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { planModules: true },
  });
  if (!plan) throw new AppError("Plan not found", "NOT_FOUND", 404);

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { businessId },
      update: { planId, status: "ACTIVE" },
      create: { businessId, planId, status: "ACTIVE" },
    });

    // Sync plan modules as PLAN source; keep OVERRIDE modules
    const existing = await tx.businessModule.findMany({ where: { businessId } });
    const overrideIds = new Set(
      existing.filter((m) => m.source === "OVERRIDE").map((m) => m.moduleId),
    );
    const planModuleIds = plan.planModules.map((pm) => pm.moduleId);

    await tx.businessModule.deleteMany({
      where: { businessId, source: "PLAN" },
    });
    await tx.businessModule.createMany({
      data: planModuleIds
        .filter((id) => !overrideIds.has(id))
        .map((moduleId) => ({
          businessId,
          moduleId,
          enabled: true,
          source: "PLAN" as const,
        })),
    });
  });

  await logActivity({
    businessId,
    userId: actorUserId,
    action: "plan.changed",
    module: "plans",
    entity: "Subscription",
    entityId: businessId,
    metadata: { planId },
  });
}

export async function updateClientModules(
  businessId: string,
  moduleIds: string[],
  actorUserId: string,
) {
  await prisma.$transaction(async (tx) => {
    await tx.businessModule.deleteMany({ where: { businessId } });
    if (moduleIds.length) {
      await tx.businessModule.createMany({
        data: moduleIds.map((moduleId) => ({
          businessId,
          moduleId,
          enabled: true,
          source: "OVERRIDE" as const,
        })),
      });
    }
  });

  await logActivity({
    businessId,
    userId: actorUserId,
    action: "modules.updated",
    module: "modules",
    entity: "Business",
    entityId: businessId,
    metadata: { moduleIds },
  });
}

export async function setClientPermissions(
  input: { businessId: string; roleId: string; permissionIds: string[] },
  actorUserId: string,
) {
  const role = await prisma.role.findFirst({
    where: { id: input.roleId, businessId: input.businessId, key: "owner" },
  });
  if (!role) {
    throw new AppError("Owner role not found for this client", "NOT_FOUND", 404);
  }

  const permissionIds = await prisma.permission.findMany({
    where: { id: { in: input.permissionIds } },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });
    }
  });

  await logActivity({
    businessId: input.businessId,
    userId: actorUserId,
    action: "client.permissions.updated",
    module: "permissions",
    entity: "Role",
    entityId: role.id,
    metadata: { permissionIds: input.permissionIds },
  });

  return role;
}

export async function createTenantUser(
  input: {
    businessId: string;
    name: string;
    email: string;
    password: string;
    roleId?: string;
    status?: "ACTIVE" | "DISABLED";
  },
  actorUserId: string,
) {
  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
  });
  if (!business) throw new AppError("Business not found", "NOT_FOUND", 404);

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

  let roleId = input.roleId;
  if (roleId) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, businessId: input.businessId },
    });
    if (!role) throw new AppError("Role not found", "NOT_FOUND", 404);
  } else {
    const owner = await prisma.role.findFirst({
      where: { businessId: input.businessId, key: "owner" },
    });
    roleId = owner?.id;
  }

  const membership = await prisma.businessMembership.create({
    data: {
      userId: signUp.user.id,
      businessId: input.businessId,
      status: input.status ?? "ACTIVE",
      roles: roleId ? { create: [{ roleId }] } : undefined,
    },
  });

  if ((input.status ?? "ACTIVE") === "DISABLED") {
    await prisma.user.update({
      where: { id: signUp.user.id },
      data: { status: "DISABLED" },
    });
  }

  await logActivity({
    businessId: input.businessId,
    userId: actorUserId,
    action: "user.created",
    module: "users",
    entity: "User",
    entityId: signUp.user.id,
  });

  return membership;
}

export async function setTenantUserStatus(
  input: {
    businessId: string;
    userId: string;
    status: "ACTIVE" | "DISABLED";
  },
  actorUserId: string,
) {
  const membership = await prisma.businessMembership.findUnique({
    where: {
      userId_businessId: {
        userId: input.userId,
        businessId: input.businessId,
      },
    },
  });
  if (!membership) throw new AppError("Membership not found", "NOT_FOUND", 404);

  await prisma.$transaction([
    prisma.businessMembership.update({
      where: { id: membership.id },
      data: { status: input.status },
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: { status: input.status },
    }),
  ]);

  await logActivity({
    businessId: input.businessId,
    userId: actorUserId,
    action: input.status === "DISABLED" ? "user.disabled" : "user.activated",
    module: "users",
    entity: "User",
    entityId: input.userId,
  });
}
