"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import { updateWebsiteContentSchema } from "@/lib/validation/schemas";
import { updateTenantWebsiteContent } from "@/server/services/websites";

export async function updateWebsiteContentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateWebsiteContentSchema.parse(raw);
    const website = await updateTenantWebsiteContent(ctx, input);
    revalidatePath("/app/settings");
    revalidatePath("/app/settings/website");
    return { ok: true, data: { id: website.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
