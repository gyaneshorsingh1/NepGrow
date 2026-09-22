import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateCategoryInput,
  CreateModuleInput,
  CreatePlanInput,
  UpdateCategoryInput,
  UpdateModuleInput,
  UpdatePlanInput,
} from "@/lib/validation/schemas";
import type { Prisma } from "@prisma/client";

async function assertUniqueSlug(
  slug: string,
  excludeId?: string,
  field: "slug" | "domainSlug" = "slug",
) {
  const existing = await prisma.businessCategory.findFirst({
    where: { [field]: slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
  if (existing) {
    throw new AppError(
      `A category with this ${field === "slug" ? "slug" : "domain"} already exists`,
      "CONFLICT",
      409,
    );
  }
}

async function assertCategoryExists(categoryId: string | null | undefined) {
  if (!categoryId) return;
  const category = await prisma.businessCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new AppError("Category not found", "NOT_FOUND", 404);
  }
}

async function assertModulesExist(moduleIds: string[]) {
  if (moduleIds.length === 0) return;
  const modules = await prisma.module.findMany({
    where: { id: { in: moduleIds } },
    select: { id: true },
  });
  if (modules.length !== moduleIds.length) {
    throw new AppError("One or more modules are invalid", "VALIDATION", 400);
  }
}

export async function createPlan(input: CreatePlanInput) {
  await assertCategoryExists(input.categoryId);
  await assertModulesExist(input.moduleIds);

  const existing = await prisma.plan.findFirst({
    where: {
      key: input.key,
      categoryId: input.categoryId,
    },
  });
  if (existing) {
    throw new AppError(
      "A plan with this key already exists for the category",
      "CONFLICT",
      409,
    );
  }

  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        name: input.name,
        key: input.key,
        description: input.description || null,
        categoryId: input.categoryId,
        priceCents: input.priceCents,
        currency: input.currency,
        billingInterval: input.billingInterval,
        limits: input.limits as Prisma.InputJsonValue,
        status: input.status,
        sortOrder: input.sortOrder,
      },
    });

    if (input.moduleIds.length > 0) {
      await tx.planModule.createMany({
        data: input.moduleIds.map((moduleId) => ({
          planId: plan.id,
          moduleId,
        })),
      });
    }

    return plan;
  });
}

export async function updatePlan(input: UpdatePlanInput) {
  const plan = await prisma.plan.findUnique({ where: { id: input.id } });
  if (!plan) throw new AppError("Plan not found", "NOT_FOUND", 404);

  if (input.categoryId !== undefined) {
    await assertCategoryExists(input.categoryId);
  }

  const nextKey = input.key ?? plan.key;
  const nextCategoryId =
    input.categoryId !== undefined ? input.categoryId : plan.categoryId;

  if (input.key !== undefined || input.categoryId !== undefined) {
    const conflict = await prisma.plan.findFirst({
      where: {
        key: nextKey,
        categoryId: nextCategoryId,
        NOT: { id: plan.id },
      },
    });
    if (conflict) {
      throw new AppError(
        "A plan with this key already exists for the category",
        "CONFLICT",
        409,
      );
    }
  }

  const data: Prisma.PlanUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.key !== undefined) data.key = input.key;
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.priceCents !== undefined) data.priceCents = input.priceCents;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.billingInterval !== undefined) {
    data.billingInterval = input.billingInterval;
  }
  if (input.limits !== undefined) {
    data.limits = input.limits as Prisma.InputJsonValue;
  }
  if (input.status !== undefined) data.status = input.status;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  return prisma.plan.update({
    where: { id: input.id },
    data,
  });
}

/** Soft-delete: marks the plan INACTIVE so existing subscriptions stay valid. */
export async function deletePlan(planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError("Plan not found", "NOT_FOUND", 404);

  return prisma.plan.update({
    where: { id: planId },
    data: { status: "INACTIVE" },
  });
}

export async function createModule(input: CreateModuleInput) {
  await assertCategoryExists(input.categoryId);

  const existing = await prisma.module.findUnique({
    where: { key: input.key },
  });
  if (existing) {
    throw new AppError("A module with this key already exists", "CONFLICT", 409);
  }

  return prisma.module.create({
    data: {
      key: input.key,
      name: input.name,
      description: input.description || null,
      categoryId: input.categoryId,
      isCore: input.isCore,
      sortOrder: input.sortOrder,
      icon: input.icon || null,
      href: input.href || null,
    },
  });
}

export async function updateModule(input: UpdateModuleInput) {
  const mod = await prisma.module.findUnique({ where: { id: input.id } });
  if (!mod) throw new AppError("Module not found", "NOT_FOUND", 404);

  if (input.categoryId !== undefined) {
    await assertCategoryExists(input.categoryId);
  }

  if (input.key !== undefined && input.key !== mod.key) {
    const conflict = await prisma.module.findUnique({
      where: { key: input.key },
    });
    if (conflict) {
      throw new AppError(
        "A module with this key already exists",
        "CONFLICT",
        409,
      );
    }
  }

  const data: Prisma.ModuleUpdateInput = {};
  if (input.key !== undefined) data.key = input.key;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.isCore !== undefined) data.isCore = input.isCore;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.icon !== undefined) data.icon = input.icon || null;
  if (input.href !== undefined) data.href = input.href || null;

  return prisma.module.update({
    where: { id: input.id },
    data,
  });
}

/**
 * Hard-delete when unused. Modules have no status field; refuse if still
 * attached to plans or businesses.
 */
export async function deleteModule(moduleId: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      _count: { select: { planModules: true, businessModules: true } },
    },
  });
  if (!mod) throw new AppError("Module not found", "NOT_FOUND", 404);

  if (mod._count.planModules > 0 || mod._count.businessModules > 0) {
    throw new AppError(
      "Module is in use by plans or businesses and cannot be deleted",
      "CONFLICT",
      409,
    );
  }

  return prisma.module.delete({ where: { id: moduleId } });
}

export async function setPlanModules(planId: string, moduleIds: string[]) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError("Plan not found", "NOT_FOUND", 404);

  const uniqueIds = [...new Set(moduleIds)];
  await assertModulesExist(uniqueIds);

  await prisma.$transaction(async (tx) => {
    await tx.planModule.deleteMany({ where: { planId } });
    if (uniqueIds.length > 0) {
      await tx.planModule.createMany({
        data: uniqueIds.map((moduleId) => ({ planId, moduleId })),
      });
    }
  });

  return { planId, count: uniqueIds.length };
}

export async function createCategory(input: CreateCategoryInput) {
  await assertUniqueSlug(input.slug);
  await assertUniqueSlug(input.domainSlug, undefined, "domainSlug");

  return prisma.businessCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      domainSlug: input.domainSlug,
      description: input.description || null,
      status: input.status,
    },
  });
}

export async function updateCategory(input: UpdateCategoryInput) {
  const category = await prisma.businessCategory.findUnique({
    where: { id: input.id },
  });
  if (!category) throw new AppError("Category not found", "NOT_FOUND", 404);

  if (input.slug !== undefined && input.slug !== category.slug) {
    await assertUniqueSlug(input.slug, input.id);
  }
  if (input.domainSlug !== undefined && input.domainSlug !== category.domainSlug) {
    await assertUniqueSlug(input.domainSlug, input.id, "domainSlug");
  }

  const data: Prisma.BusinessCategoryUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.domainSlug !== undefined) data.domainSlug = input.domainSlug;
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.status !== undefined) data.status = input.status;

  return prisma.businessCategory.update({
    where: { id: input.id },
    data,
  });
}

/**
 * Soft-delete: marks the category INACTIVE so existing businesses,
 * plans, and modules keep their references.
 */
export async function deleteCategory(categoryId: string) {
  const category = await prisma.businessCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new AppError("Category not found", "NOT_FOUND", 404);

  return prisma.businessCategory.update({
    where: { id: categoryId },
    data: { status: "INACTIVE" },
  });
}
