"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function DashboardCharts({
  revenueByDay,
  bookingsByStatus,
  overview,
}: {
  revenueByDay: Array<{ date: string; amount: number }>;
  bookingsByStatus: Array<{ name: string; value: number }>;
  overview: Array<{ name: string; value: number }>;
}) {
  const hasRevenue = revenueByDay.some((d) => d.amount > 0);
  const hasBookings = bookingsByStatus.some((d) => d.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Revenue (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={56} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed payments in the last 14 days." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bookings by status</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {hasBookings ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {bookingsByStatus.map((_, i) => (
                    <Cell
                      key={bookingsByStatus[i].name}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No bookings yet." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations overview</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--chart-2)" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
