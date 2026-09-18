"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import {
  createCategorySchema,
  createModuleSchema,
  createPlanSchema,
  deleteCategorySchema,
  deleteModuleSchema,
  deletePlanSchema,
  setPlanModulesSchema,
  updateCategorySchema,
  updateModuleSchema,
  updatePlanSchema,
} from "@/lib/validation/schemas";
import {
  createCategory,
  createModule,
  createPlan,
  deleteCategory,
  deleteModule,
  deletePlan,
  setPlanModules,
  updateCategory,
  updateModule,
  updatePlan,
} from "@/server/services/catalog";

function revalidateCatalog() {
  revalidatePath("/admin/plans");
  revalidatePath("/admin/modules");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  revalidatePath("/admin/clients/new");
}

export async function createPlanAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = createPlanSchema.parse(raw);
    const plan = await createPlan(input);
    revalidateCatalog();
    return { ok: true, data: { id: plan.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updatePlanAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = updatePlanSchema.parse(raw);
    const plan = await updatePlan(input);
    revalidateCatalog();
    return { ok: true, data: { id: plan.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deletePlanAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = deletePlanSchema.parse(raw);
    const plan = await deletePlan(input.id);
    revalidateCatalog();
    return { ok: true, data: { id: plan.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setPlanModulesAction(
  raw: unknown,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requirePlatformAdmin();
    const input = setPlanModulesSchema.parse(raw);
    const result = await setPlanModules(input.planId, input.moduleIds);
    revalidateCatalog();
    return { ok: true, data: { count: result.count } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createModuleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = createModuleSchema.parse(raw);
    const mod = await createModule(input);
    revalidateCatalog();
    return { ok: true, data: { id: mod.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateModuleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = updateModuleSchema.parse(raw);
    const mod = await updateModule(input);
    revalidateCatalog();
    return { ok: true, data: { id: mod.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteModuleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = deleteModuleSchema.parse(raw);
    const mod = await deleteModule(input.id);
    revalidateCatalog();
    return { ok: true, data: { id: mod.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = createCategorySchema.parse(raw);
    const category = await createCategory(input);
    revalidateCatalog();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = updateCategorySchema.parse(raw);
    const category = await updateCategory(input);
    revalidateCatalog();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePlatformAdmin();
    const input = deleteCategorySchema.parse(raw);
    const category = await deleteCategory(input.id);
    revalidateCatalog();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
