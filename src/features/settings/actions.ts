"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import {
  authorize,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import {
  createAndSetBusinessCurrencySchema,
  setBusinessCurrencySchema,
  updateBusinessProfileSchema,
} from "@/lib/validation/schemas";
import {
  ensureCurrency,
  setBusinessCurrency,
} from "@/server/services/currencies";
import { updateBusinessProfile } from "@/server/services/business";

export async function setBusinessCurrencyAction(
  raw: unknown,
): Promise<ActionResult<{ currency: string }>> {
  try {
    const ctx = await resolveTenantContext();
    await authorize(ctx, "update", "settings", "settings");
    const input = setBusinessCurrencySchema.parse(raw);
    await setBusinessCurrency(ctx.businessId, input.currencyCode, ctx.userId);
    revalidatePath("/app/settings");
    revalidatePath("/app/business");
    revalidatePath("/app");
    revalidatePath("/app/payments");
    revalidatePath("/app/memberships");
    revalidatePath("/app/courts");
    revalidatePath("/app/bookings");
    revalidatePath("/app/reports");
    return { ok: true, data: { currency: input.currencyCode.toUpperCase() } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createAndSetBusinessCurrencyAction(
  raw: unknown,
): Promise<ActionResult<{ currency: string }>> {
  try {
    const ctx = await resolveTenantContext();
    await authorize(ctx, "update", "settings", "settings");
    const input = createAndSetBusinessCurrencySchema.parse(raw);
    const currency = await ensureCurrency({
      code: input.code,
      name: input.name,
      symbol: input.symbol || undefined,
      decimals: input.decimals,
    });
    await setBusinessCurrency(ctx.businessId, currency.code, ctx.userId);
    revalidatePath("/app/settings");
    revalidatePath("/app/business");
    revalidatePath("/admin/currencies");
    revalidatePath("/app");
    revalidatePath("/app/payments");
    revalidatePath("/app/memberships");
    revalidatePath("/app/courts");
    revalidatePath("/app/bookings");
    revalidatePath("/app/reports");
    return { ok: true, data: { currency: currency.code } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateBusinessProfileAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateBusinessProfileSchema.parse(raw);
    const business = await updateBusinessProfile(ctx, input);
    revalidatePath("/app/business");
    revalidatePath("/app/settings");
    revalidatePath("/app");
    return { ok: true, data: { id: business.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
