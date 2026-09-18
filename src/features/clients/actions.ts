"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import {
  createClientSchema,
  updateClientStatusSchema,
} from "@/lib/validation/schemas";
import {
  createClient,
  setClientStatus,
} from "@/server/services/clients";
import type { ActionResult } from "@/lib/actions/types";

export async function createClientAction(
  raw: unknown,
): Promise<ActionResult<{ businessId: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = createClientSchema.parse(raw);
    const result = await createClient(input, session.user.id);
    revalidatePath("/admin/clients");
    revalidatePath("/admin");
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
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${input.businessId}`);
    revalidatePath("/admin");
    return { ok: true, data: { status: business.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
