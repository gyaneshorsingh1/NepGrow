"use server";

import { revalidatePath } from "next/cache";

import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/actions/types";
import {
  createEmployeeSchema,
  setEmployeeDirectPermissionsSchema,
  setEmployeeStatusSchema,
  updateEmployeeRolesSchema,
} from "@/lib/validation/schemas";
import {
  createEmployee,
  setEmployeeDirectPermissions,
  setEmployeeStatus,
  updateEmployeeRoles,
} from "@/server/services/employees";

function revalidateEmployeePaths(membershipId?: string) {
  revalidatePath("/app/staff");
  if (membershipId) {
    revalidatePath(`/app/staff/${membershipId}`);
  }
}

export async function createEmployeeAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createEmployeeSchema.parse(raw);
    const membership = await createEmployee(ctx, input);
    revalidateEmployeePaths(membership.id);
    return { ok: true, data: { id: membership.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateEmployeeRolesAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateEmployeeRolesSchema.parse(raw);
    await updateEmployeeRoles(ctx, input);
    revalidateEmployeePaths(input.membershipId);
    return { ok: true, data: { id: input.membershipId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setEmployeeDirectPermissionsAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = setEmployeeDirectPermissionsSchema.parse(raw);
    await setEmployeeDirectPermissions(ctx, input);
    revalidateEmployeePaths(input.membershipId);
    return { ok: true, data: { id: input.membershipId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setEmployeeStatusAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = setEmployeeStatusSchema.parse(raw);
    await setEmployeeStatus(ctx, input);
    revalidateEmployeePaths(input.membershipId);
    return { ok: true, data: { id: input.membershipId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
