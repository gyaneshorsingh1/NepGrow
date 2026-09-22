"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccountingReportCharts({
  daySeries,
  byCategory,
}: {
  daySeries: Array<{ date: string; income: number; expense: number }>;
  byCategory: Array<{ name: string; income: number; expense: number }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income vs expense (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daySeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.25}
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--chart-5)"
                fill="var(--chart-5)"
                fillOpacity={0.2}
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {byCategory.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No categorized transactions yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="income" fill="var(--chart-2)" name="Income" />
                <Bar dataKey="expense" fill="var(--chart-5)" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
