import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveTenantContext } from "@/lib/authorization/context";
import { formatTenantMoney } from "@/lib/utils";
import {
  listAccountingTransactions,
  listCashbookAccounts,
} from "@/server/services/accounting";

import { CreateTransactionForm } from "./create-transaction-form";
import { DeleteTransactionButton } from "./delete-transaction-button";

export const metadata = { title: "Transaction History" };

export default async function AccountingTransactionsPage() {
  const ctx = await resolveTenantContext();
  const [transactions, accounts] = await Promise.all([
    listAccountingTransactions(ctx),
    listCashbookAccounts(ctx),
  ]);

  const activeAccounts = accounts
    .filter((a) => a.status === "ACTIVE")
    .map((a) => ({ id: a.id, name: a.name }));

  const canCreate = ctx.ability.can("create", "accounting");
  const canDelete = ctx.ability.can("delete", "accounting");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction History"
        description="Income and expense entries across cashbook accounts."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/accounting/cashbook">Manage accounts</Link>
          </Button>
        }
      />

      {canCreate ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Record transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTransactionForm
              accounts={activeAccounts}
              currencyDecimals={ctx.currencyDecimals}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No transactions yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">
                    {t.occurredAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>{t.account.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.type} />
                  </TableCell>
                  <TableCell>{t.category ?? "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {t.description ?? t.reference ?? "—"}
                  </TableCell>
                  <TableCell
                    className={
                      t.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {t.type === "INCOME" ? "+" : "−"}
                    {formatTenantMoney(t.amountCents, {
                      currency: t.currency || ctx.currency,
                      currencyDecimals: ctx.currencyDecimals,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteTransactionButton
                      transactionId={t.id}
                      canDelete={canDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
