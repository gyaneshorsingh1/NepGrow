import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Default business / platform currency when none is configured. */
export const DEFAULT_CURRENCY = "NPR";

/**
 * Format a money amount for display (major units as entered — no cent/paisa conversion).
 */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  decimals = 2,
): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(decimals)}`;
  }
}

/** Format using the tenant's configured currency. */
export function formatTenantMoney(
  amount: number,
  ctx: { currency: string; currencyDecimals?: number },
): string {
  return formatMoney(amount, ctx.currency, ctx.currencyDecimals ?? 2);
}
