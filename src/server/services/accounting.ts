import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { TenantContext } from "@/lib/authorization/context";
import { authorize, requireModule } from "@/lib/authorization/context";
import { logActivity } from "@/server/services/activity";

function accountBalance(
  openingBalanceCents: number,
  transactions: Array<{ type: "INCOME" | "EXPENSE"; amountCents: number }>,
) {
  return transactions.reduce((sum, t) => {
    const amount = Number(t.amountCents);
    return t.type === "INCOME" ? sum + amount : sum - amount;
  }, Number(openingBalanceCents));
}

export async function listCashbookAccounts(ctx: TenantContext) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "view", "accounting", "accounting");

  const accounts = await prisma.cashbookAccount.findMany({
    where: { businessId: ctx.businessId },
    include: {
      transactions: { select: { type: true, amountCents: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return accounts.map(({ transactions, ...account }) => ({
    ...account,
    balanceCents: accountBalance(account.openingBalanceCents, transactions),
  }));
}

export async function getCashbookAccount(ctx: TenantContext, accountId: string) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "view", "accounting", "accounting");

  const account = await prisma.cashbookAccount.findFirst({
    where: { id: accountId, businessId: ctx.businessId },
    include: {
      transactions: { select: { type: true, amountCents: true } },
      _count: { select: { transactions: true } },
    },
  });
  if (!account) throw new AppError("Account not found", "NOT_FOUND", 404);

  const { transactions, ...rest } = account;
  return {
    ...rest,
    balanceCents: accountBalance(account.openingBalanceCents, transactions),
  };
}

export async function createCashbookAccount(
  ctx: TenantContext,
  data: {
    name: string;
    type?: "CASH" | "BANK" | "WALLET" | "OTHER";
    openingBalanceCents?: number;
    notes?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "create", "accounting", "accounting");

  const account = await prisma.cashbookAccount.create({
    data: {
      businessId: ctx.businessId,
      name: data.name.trim(),
      type: data.type ?? "CASH",
      openingBalanceCents: data.openingBalanceCents ?? 0,
      currency: ctx.currency,
      notes: data.notes || null,
      status: data.status ?? "ACTIVE",
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "cashbook_account.created",
    module: "accounting",
    entity: "CashbookAccount",
    entityId: account.id,
  });

  return account;
}

export async function updateCashbookAccount(
  ctx: TenantContext,
  accountId: string,
  data: {
    name: string;
    type?: "CASH" | "BANK" | "WALLET" | "OTHER";
    openingBalanceCents?: number;
    notes?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "update", "accounting", "accounting");

  const existing = await prisma.cashbookAccount.findFirst({
    where: { id: accountId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Account not found", "NOT_FOUND", 404);

  const account = await prisma.cashbookAccount.update({
    where: { id: accountId },
    data: {
      name: data.name.trim(),
      ...(data.type ? { type: data.type } : {}),
      openingBalanceCents: data.openingBalanceCents ?? existing.openingBalanceCents,
      notes: data.notes || null,
      ...(data.status ? { status: data.status } : {}),
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "cashbook_account.updated",
    module: "accounting",
    entity: "CashbookAccount",
    entityId: account.id,
  });

  return account;
}

export async function deleteCashbookAccount(
  ctx: TenantContext,
  accountId: string,
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "delete", "accounting", "accounting");

  const existing = await prisma.cashbookAccount.findFirst({
    where: { id: accountId, businessId: ctx.businessId },
    include: { _count: { select: { transactions: true } } },
  });
  if (!existing) throw new AppError("Account not found", "NOT_FOUND", 404);
  if (existing._count.transactions > 0) {
    throw new AppError(
      "Cannot delete an account that has transactions. Mark it inactive instead.",
      "CONFLICT",
      409,
    );
  }

  await prisma.cashbookAccount.delete({ where: { id: accountId } });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "cashbook_account.deleted",
    module: "accounting",
    entity: "CashbookAccount",
    entityId: accountId,
  });
}

export async function listAccountingTransactions(
  ctx: TenantContext,
  opts?: { accountId?: string; limit?: number },
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "view", "accounting", "accounting");

  return prisma.accountingTransaction.findMany({
    where: {
      businessId: ctx.businessId,
      ...(opts?.accountId ? { accountId: opts.accountId } : {}),
    },
    include: {
      account: { select: { id: true, name: true, type: true } },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: opts?.limit ?? 500,
  });
}

export async function createAccountingTransaction(
  ctx: TenantContext,
  data: {
    accountId: string;
    type: "INCOME" | "EXPENSE";
    amountCents: number;
    category?: string;
    description?: string;
    reference?: string;
    occurredAt?: Date;
    paymentId?: string;
  },
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "create", "accounting", "accounting");

  const account = await prisma.cashbookAccount.findFirst({
    where: {
      id: data.accountId,
      businessId: ctx.businessId,
      status: "ACTIVE",
    },
  });
  if (!account) {
    throw new AppError("Active cashbook account not found", "NOT_FOUND", 404);
  }

  if (!(data.amountCents > 0)) {
    throw new AppError("Amount must be greater than zero", "VALIDATION", 400);
  }

  const txn = await prisma.accountingTransaction.create({
    data: {
      businessId: ctx.businessId,
      accountId: account.id,
      type: data.type,
      amountCents: data.amountCents,
      currency: account.currency || ctx.currency,
      category: data.category?.trim() || null,
      description: data.description?.trim() || null,
      reference: data.reference?.trim() || null,
      occurredAt: data.occurredAt ?? new Date(),
      paymentId: data.paymentId || null,
    },
    include: {
      account: { select: { id: true, name: true, type: true } },
    },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "accounting_transaction.created",
    module: "accounting",
    entity: "AccountingTransaction",
    entityId: txn.id,
  });

  return txn;
}

export async function deleteAccountingTransaction(
  ctx: TenantContext,
  transactionId: string,
) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "delete", "accounting", "accounting");

  const existing = await prisma.accountingTransaction.findFirst({
    where: { id: transactionId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Transaction not found", "NOT_FOUND", 404);

  await prisma.accountingTransaction.delete({ where: { id: transactionId } });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "accounting_transaction.deleted",
    module: "accounting",
    entity: "AccountingTransaction",
    entityId: transactionId,
  });
}

/**
 * Post a completed payment as an INCOME entry on the selected cashbook
 * account. Safe to call inside a payment transaction (pass `tx`); it is
 * idempotent per payment so a payment is never posted twice.
 */
export async function postCashbookPayment(
  ctx: TenantContext,
  data: {
    paymentId: string;
    accountId: string;
    amountCents: number;
    category?: string;
    description?: string;
    occurredAt?: Date;
    tx?: Prisma.TransactionClient;
  },
) {
  const db = data.tx ?? prisma;

  const account = await db.cashbookAccount.findFirst({
    where: { id: data.accountId, businessId: ctx.businessId, status: "ACTIVE" },
    select: { id: true, currency: true },
  });
  if (!account) {
    throw new AppError("Active cashbook account not found", "NOT_FOUND", 404);
  }

  const existing = await db.accountingTransaction.findFirst({
    where: { paymentId: data.paymentId, type: "INCOME" },
  });
  if (existing) return existing;

  return db.accountingTransaction.create({
    data: {
      businessId: ctx.businessId,
      accountId: account.id,
      type: "INCOME",
      amountCents: data.amountCents,
      currency: account.currency || ctx.currency,
      category: data.category?.trim() || "Payment",
      description: data.description?.trim() || null,
      paymentId: data.paymentId,
      occurredAt: data.occurredAt ?? new Date(),
    },
  });
}

/**
 * Reverse a refunded payment as an EXPENSE entry on the account the original
 * payment was posted to. Idempotent per payment; no-op when the payment was
 * never posted to a cashbook account.
 */
export async function reverseCashbookPayment(
  ctx: TenantContext,
  data: { paymentId: string; tx?: Prisma.TransactionClient },
) {
  const db = data.tx ?? prisma;

  const original = await db.accountingTransaction.findFirst({
    where: { paymentId: data.paymentId, type: "INCOME" },
    select: { amountCents: true, accountId: true, category: true },
  });
  if (!original) return null;

  const existing = await db.accountingTransaction.findFirst({
    where: { paymentId: data.paymentId, type: "EXPENSE" },
  });
  if (existing) return existing;

  const account = await db.cashbookAccount.findFirst({
    where: { id: original.accountId, businessId: ctx.businessId },
    select: { id: true, currency: true },
  });
  if (!account) throw new AppError("Cashbook account not found", "NOT_FOUND", 404);

  return db.accountingTransaction.create({
    data: {
      businessId: ctx.businessId,
      accountId: account.id,
      type: "EXPENSE",
      amountCents: original.amountCents,
      currency: account.currency || ctx.currency,
      category: original.category || "Refund",
      description: "Payment refunded",
      paymentId: data.paymentId,
      occurredAt: new Date(),
    },
  });
}

export async function getAccountingReport(ctx: TenantContext) {
  await requireModule(ctx, "accounting");
  await authorize(ctx, "view", "accounting", "accounting");

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [accounts, transactions, periodTxns] = await Promise.all([
    prisma.cashbookAccount.findMany({
      where: { businessId: ctx.businessId },
      include: {
        transactions: { select: { type: true, amountCents: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.accountingTransaction.findMany({
      where: { businessId: ctx.businessId },
      select: {
        type: true,
        amountCents: true,
        category: true,
      },
    }),
    prisma.accountingTransaction.findMany({
      where: {
        businessId: ctx.businessId,
        occurredAt: { gte: since },
      },
      select: {
        type: true,
        amountCents: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const amount = Number(t.amountCents);
    if (t.type === "INCOME") totalIncome += amount;
    else totalExpense += amount;

    const key = t.category?.trim() || "Uncategorized";
    const row = byCategory.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") row.income += amount;
    else row.expense += amount;
    byCategory.set(key, row);
  }

  const accountBalances = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    status: a.status,
    balanceCents: accountBalance(a.openingBalanceCents, a.transactions),
  }));

  const daySeries: Array<{ date: string; income: number; expense: number }> =
    [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    let income = 0;
    let expense = 0;
    for (const t of periodTxns) {
      if (t.occurredAt >= dayStart && t.occurredAt < dayEnd) {
        const amount = Number(t.amountCents);
        if (t.type === "INCOME") income += amount;
        else expense += amount;
      }
    }
    daySeries.push({
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      income,
      expense,
    });
  }

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    accountBalances,
    byCategory: [...byCategory.entries()]
      .map(([name, v]) => ({
        name,
        income: v.income,
        expense: v.expense,
        net: v.income - v.expense,
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    daySeries,
    transactionCount: transactions.length,
    accountCount: accounts.length,
  };
}
