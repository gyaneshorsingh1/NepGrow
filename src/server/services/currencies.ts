import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { DEFAULT_CURRENCY } from "@/lib/utils";
import { logActivity } from "@/server/services/activity";

export type CurrencyInput = {
  code: string;
  name: string;
  symbol?: string | null;
  decimals?: number;
  status?: "ACTIVE" | "INACTIVE";
  sortOrder?: number;
};

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export async function listCurrencies(opts?: {
  activeOnly?: boolean;
}) {
  return prisma.currency.findMany({
    where: opts?.activeOnly ? { status: "ACTIVE" } : undefined,
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
}

export async function getCurrencyByCode(code: string) {
  return prisma.currency.findUnique({
    where: { code: normalizeCode(code) },
  });
}

export async function createCurrency(
  input: CurrencyInput,
  actorUserId?: string,
) {
  const code = normalizeCode(input.code);
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new AppError(
      "Currency code must be a 3-letter ISO code (e.g. NPR, USD)",
      "VALIDATION",
      400,
    );
  }
  const name = input.name.trim();
  if (name.length < 2) {
    throw new AppError("Currency name is required", "VALIDATION", 400);
  }

  const existing = await prisma.currency.findUnique({ where: { code } });
  if (existing) {
    throw new AppError(`Currency ${code} already exists`, "CONFLICT", 409);
  }

  const currency = await prisma.currency.create({
    data: {
      code,
      name,
      symbol: input.symbol?.trim() || null,
      decimals: input.decimals ?? 2,
      status: input.status ?? "ACTIVE",
      sortOrder: input.sortOrder ?? 100,
    },
  });

  if (actorUserId) {
    await logActivity({
      userId: actorUserId,
      action: "currency.created",
      module: "settings",
      entity: "Currency",
      entityId: currency.id,
      metadata: { code },
    });
  }

  return currency;
}

export async function updateCurrency(
  id: string,
  input: Partial<CurrencyInput>,
  actorUserId?: string,
) {
  const existing = await prisma.currency.findUnique({ where: { id } });
  if (!existing) throw new AppError("Currency not found", "NOT_FOUND", 404);

  const data: {
    name?: string;
    symbol?: string | null;
    decimals?: number;
    status?: "ACTIVE" | "INACTIVE";
    sortOrder?: number;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) {
      throw new AppError("Currency name is required", "VALIDATION", 400);
    }
    data.name = name;
  }
  if (input.symbol !== undefined) {
    data.symbol = input.symbol?.trim() || null;
  }
  if (input.decimals !== undefined) data.decimals = input.decimals;
  if (input.status !== undefined) data.status = input.status;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  const currency = await prisma.currency.update({
    where: { id },
    data,
  });

  if (actorUserId) {
    await logActivity({
      userId: actorUserId,
      action: "currency.updated",
      module: "settings",
      entity: "Currency",
      entityId: currency.id,
      metadata: { code: currency.code },
    });
  }

  return currency;
}

/**
 * Ensure a currency exists in the catalog (create if missing), return code.
 */
export async function ensureCurrency(input: {
  code: string;
  name?: string;
  symbol?: string;
  decimals?: number;
}) {
  const code = normalizeCode(input.code);
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new AppError(
      "Currency code must be a 3-letter ISO code (e.g. NPR, USD)",
      "VALIDATION",
      400,
    );
  }

  const existing = await prisma.currency.findUnique({ where: { code } });
  if (existing) {
    if (existing.status !== "ACTIVE") {
      return prisma.currency.update({
        where: { code },
        data: { status: "ACTIVE" },
      });
    }
    return existing;
  }

  return prisma.currency.create({
    data: {
      code,
      name: input.name?.trim() || code,
      symbol: input.symbol?.trim() || null,
      decimals: input.decimals ?? 2,
      status: "ACTIVE",
      sortOrder: 100,
    },
  });
}

export async function setBusinessCurrency(
  businessId: string,
  currencyCode: string,
  actorUserId: string,
) {
  const code = normalizeCode(currencyCode);
  const currency = await prisma.currency.findUnique({ where: { code } });
  if (!currency || currency.status !== "ACTIVE") {
    throw new AppError(
      "Select an active currency from the catalog, or create one first",
      "VALIDATION",
      400,
    );
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { currency: code },
  });

  await logActivity({
    businessId,
    userId: actorUserId,
    action: "business.currency.updated",
    module: "settings",
    entity: "Business",
    entityId: businessId,
    metadata: { currency: code },
  });

  return business;
}

export async function resolveBusinessCurrency(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { currency: true },
  });
  const code = business?.currency || DEFAULT_CURRENCY;
  const meta = await prisma.currency.findUnique({ where: { code } });
  return {
    code,
    name: meta?.name ?? code,
    symbol: meta?.symbol ?? null,
    decimals: meta?.decimals ?? 2,
  };
}
