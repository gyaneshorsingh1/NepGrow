"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import {
  createAccountingTransactionSchema,
  createCashbookAccountSchema,
  deleteAccountingTransactionSchema,
  deleteCashbookAccountSchema,
  updateCashbookAccountSchema,
} from "@/lib/validation/schemas";
import {
  createAccountingTransaction,
  createCashbookAccount,
  deleteAccountingTransaction,
  deleteCashbookAccount,
  updateCashbookAccount,
} from "@/server/services/accounting";

function revalidateAccounting() {
  revalidatePath("/app/accounting");
  revalidatePath("/app/accounting/transactions");
  revalidatePath("/app/accounting/cashbook");
  revalidatePath("/app/accounting/reports");
}

export async function createCashbookAccountAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createCashbookAccountSchema.parse(raw);
    const account = await createCashbookAccount(ctx, {
      name: input.name,
      type: input.type,
      openingBalanceCents: input.openingBalanceCents,
      notes: input.notes,
      status: input.status,
    });
    revalidateAccounting();
    return { ok: true, data: { id: account.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCashbookAccountAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateCashbookAccountSchema.parse(raw);
    const account = await updateCashbookAccount(ctx, input.accountId, {
      name: input.name,
      type: input.type,
      openingBalanceCents: input.openingBalanceCents,
      notes: input.notes,
      status: input.status,
    });
    revalidateAccounting();
    return { ok: true, data: { id: account.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCashbookAccountAction(
  raw: unknown,
): Promise<ActionResult> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteCashbookAccountSchema.parse(raw);
    await deleteCashbookAccount(ctx, input.accountId);
    revalidateAccounting();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createAccountingTransactionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createAccountingTransactionSchema.parse(raw);
    const txn = await createAccountingTransaction(ctx, {
      accountId: input.accountId,
      type: input.type,
      amountCents: input.amountCents,
      category: input.category,
      description: input.description,
      reference: input.reference,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    });
    revalidateAccounting();
    return { ok: true, data: { id: txn.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteAccountingTransactionAction(
  raw: unknown,
): Promise<ActionResult> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteAccountingTransactionSchema.parse(raw);
    await deleteAccountingTransaction(ctx, input.transactionId);
    revalidateAccounting();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
