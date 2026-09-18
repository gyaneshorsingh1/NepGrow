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
          status: "ACTIVE",
        },
      });

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
