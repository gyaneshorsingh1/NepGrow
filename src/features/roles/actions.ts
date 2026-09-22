"use server";

import { revalidatePath } from "next/cache";

import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import {
  createRoleSchema,
  deleteRoleSchema,
  updateRoleSchema,
} from "@/lib/validation/schemas";
import type { ActionResult } from "@/lib/actions/types";
import {
  createBusinessRole,
  deleteBusinessRole,
  updateBusinessRole,
} from "@/server/services/roles";

export async function createRoleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createRoleSchema.parse(raw);
    const role = await createBusinessRole(ctx, input);
    revalidatePath("/app/roles");
    return { ok: true, data: { id: role.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateRoleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateRoleSchema.parse(raw);
    const id = await updateBusinessRole(ctx, input);
    revalidatePath("/app/roles");
    revalidatePath(`/app/roles/${id}`);
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteRoleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteRoleSchema.parse(raw);
    await deleteBusinessRole(ctx, input.id);
    revalidatePath("/app/roles");
    return { ok: true, data: { id: input.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
