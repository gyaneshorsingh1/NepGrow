import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { formatTenantMoney } from "@/lib/utils";
import {
  getCashbookAccount,
  listAccountingTransactions,
} from "@/server/services/accounting";

export const metadata = { title: "Account details" };

export default async function CashbookAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "accounting");

  let account;
  try {
    await authorize(ctx, "view", "accounting", "accounting");
    account = await getCashbookAccount(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const transactions = await listAccountingTransactions(ctx, { accountId: id });

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        description="Cashbook account details."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/accounting/cashbook">Back to accounts</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={account.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Opening balance</p>
            <p className="font-medium">
              {formatTenantMoney(account.openingBalanceCents, {
                currency: account.currency || ctx.currency,
                currencyDecimals: ctx.currencyDecimals,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-medium">
              {formatTenantMoney(account.balanceCents, {
                currency: account.currency || ctx.currency,
                currencyDecimals: ctx.currencyDecimals,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-medium">{account.currency || ctx.currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="font-medium">{account._count.transactions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium">
              {account.createdAt.toLocaleDateString()}
            </p>
          </div>
          {account.notes ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{account.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Transactions</h2>
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Record income or expense entries against this account."
          />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">
                      {t.occurredAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.type} />
                    </TableCell>
                    <TableCell>{t.category ?? "—"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {t.description ?? t.reference ?? "—"}
                    </TableCell>
                    <TableCell
                      className={
                        t.type === "INCOME"
                          ? "text-right text-emerald-600"
                          : "text-right text-red-600"
                      }
                    >
                      {t.type === "INCOME" ? "+" : "−"}
                      {formatTenantMoney(t.amountCents, {
                        currency: t.currency || ctx.currency,
                        currencyDecimals: ctx.currencyDecimals,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}