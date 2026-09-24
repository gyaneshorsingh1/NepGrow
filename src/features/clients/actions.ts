"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import {
  changeClientPlanSchema,
  createClientSchema,
  createTenantUserSchema,
  setClientPermissionsSchema,
  setTenantUserStatusSchema,
  updateClientModulesSchema,
  updateClientProfileSchema,
  updateClientStatusSchema,
} from "@/lib/validation/schemas";
import {
  changeClientPlan,
  createClient,
  createTenantUser,
  setClientPermissions,
  setClientStatus,
  setTenantUserStatus,
  updateClientModules,
  updateClientProfile,
} from "@/server/services/clients";

function revalidateClient(businessId: string) {
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${businessId}`);
  revalidatePath("/admin");
}

export async function createClientAction(
  raw: unknown,
): Promise<ActionResult<{ businessId: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = createClientSchema.parse(raw);
    const result = await createClient(input, session.user.id);
    revalidateClient(result.business.id);
    return { ok: true, data: { businessId: result.business.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateClientStatusAction(
  raw: unknown,
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = updateClientStatusSchema.parse(raw);
    const business = await setClientStatus(
      input.businessId,
      input.status,
      session.user.id,
    );
    revalidateClient(input.businessId);
    return { ok: true, data: { status: business.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateClientProfileAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = updateClientProfileSchema.parse(raw);
    const business = await updateClientProfile(input, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { id: business.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function changeClientPlanAction(
  raw: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = changeClientPlanSchema.parse(raw);
    await changeClientPlan(input.businessId, input.planId, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { planId: input.planId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateClientModulesAction(
  raw: unknown,
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = updateClientModulesSchema.parse(raw);
    await updateClientModules(input.businessId, input.moduleIds, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { count: input.moduleIds.length } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setClientPermissionsAction(
  raw: unknown,
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = setClientPermissionsSchema.parse(raw);
    await setClientPermissions(input, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { count: input.permissionIds.length } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createTenantUserAction(
  raw: unknown,
): Promise<ActionResult<{ membershipId: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = createTenantUserSchema.parse(raw);
    const membership = await createTenantUser(input, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { membershipId: membership.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setTenantUserStatusAction(
  raw: unknown,
): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = setTenantUserStatusSchema.parse(raw);
    await setTenantUserStatus(input, session.user.id);
    revalidateClient(input.businessId);
    return { ok: true, data: { status: input.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
