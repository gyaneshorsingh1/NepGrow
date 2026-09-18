"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import {
  createCurrencySchema,
  updateCurrencySchema,
} from "@/lib/validation/schemas";
import {
  createCurrency,
  updateCurrency,
} from "@/server/services/currencies";

function revalidateCurrencies() {
  revalidatePath("/admin/currencies");
  revalidatePath("/app/settings");
  revalidatePath("/admin/clients/new");
}

export async function createCurrencyAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = createCurrencySchema.parse(raw);
    const currency = await createCurrency(
      {
        code: input.code,
        name: input.name,
        symbol: input.symbol || null,
        decimals: input.decimals,
        status: input.status,
        sortOrder: input.sortOrder,
      },
      session.user.id,
    );
    revalidateCurrencies();
    return { ok: true, data: { id: currency.id, code: currency.code } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCurrencyAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePlatformAdmin();
    const input = updateCurrencySchema.parse(raw);
    const currency = await updateCurrency(
      input.id,
      {
        name: input.name,
        symbol: input.symbol,
        decimals: input.decimals,
        status: input.status,
        sortOrder: input.sortOrder,
      },
      session.user.id,
    );
    revalidateCurrencies();
    return { ok: true, data: { id: currency.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
