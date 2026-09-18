import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getAccountingReport } from "@/server/services/accounting";

import { AccountingReportCharts } from "./accounting-report-charts";

export const metadata = { title: "Accounting Report" };

export default async function AccountingReportPage() {
  const ctx = await resolveTenantContext();
  const report = await getAccountingReport(ctx);

  const money = (amount: number) =>
    formatTenantMoney(amount, {
      currency: ctx.currency,
      currencyDecimals: ctx.currencyDecimals,
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting Report"
        description="Cashbook balances, income, expenses, and category breakdown."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total income
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {money(report.totalIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total expense
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-600">
            {money(report.totalExpense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net</CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-semibold ${
              report.net >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {money(report.net)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {report.transactionCount}
          </CardContent>
        </Card>
      </div>

      <AccountingReportCharts
        daySeries={report.daySeries}
        byCategory={report.byCategory}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Account balances</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.accountBalances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No accounts yet.
                  </TableCell>
                </TableRow>
              ) : (
                report.accountBalances.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {money(a.balanceCents)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Category summary</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expense</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byCategory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No category data yet.
                  </TableCell>
                </TableRow>
              ) : (
                report.byCategory.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-emerald-600">
                      {money(c.income)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {money(c.expense)}
                    </TableCell>
                    <TableCell className="text-right">{money(c.net)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
