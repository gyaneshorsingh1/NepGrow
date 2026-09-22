import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import { listCashbookAccounts } from "@/server/services/accounting";

import { AccountRowActions } from "./account-row-actions";

export const metadata = { title: "Cashbook Accounts" };

export default async function CashbookAccountsPage() {
  const ctx = await resolveTenantContext();
  const accounts = await listCashbookAccounts(ctx);

  const canCreate = ctx.ability.can("create", "accounting");
  const canView = ctx.ability.can("view", "accounting");
  const canUpdate = ctx.ability.can("update", "accounting");
  const canDelete = ctx.ability.can("delete", "accounting");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashbook Accounts"
        description="Cash, bank, and wallet accounts used for bookkeeping."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/accounting/transactions">Transactions</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/app/accounting/cashbook/new">+ Add Account</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Opening</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No cashbook accounts yet.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    {formatTenantMoney(a.openingBalanceCents, {
                      currency: a.currency || ctx.currency,
                      currencyDecimals: ctx.currencyDecimals,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatTenantMoney(a.balanceCents, {
                      currency: a.currency || ctx.currency,
                      currencyDecimals: ctx.currencyDecimals,
                    })}
                  </TableCell>
                  <TableCell>{a._count.transactions}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    <AccountRowActions
                      account={{
                        id: a.id,
                        name: a.name,
                        status: a.status,
                        openingBalanceCents: a.openingBalanceCents,
                        notes: a.notes,
                        _count: a._count,
                      }}
                      canView={canView}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      currencyDecimals={ctx.currencyDecimals}
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
