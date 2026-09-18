import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatTenantMoney } from "@/lib/utils";

import { DashboardCharts } from "./dashboard-charts";

export const metadata = { title: "Dashboard" };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function TenantDashboardPage() {
  const ctx = await resolveTenantContext();
  const businessId = ctx.businessId;
  const enabled = new Set(ctx.enabledModuleKeys);

  const since = startOfDay(new Date());
  since.setDate(since.getDate() - 13);

  const [
    customers,
    openBookings,
    facilities,
    courts,
    activeMemberships,
    pendingPayments,
    paymentsAgg,
    recentPayments,
    bookingGroups,
    revenuePayments,
    recentBookings,
  ] = await Promise.all([
    prisma.customer.count({ where: { businessId } }),
    prisma.booking.count({
      where: {
        businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.facility.count({ where: { businessId } }),
    prisma.court.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.membership.count({
      where: { businessId, status: "ACTIVE" },
    }),
    prisma.payment.count({
      where: { businessId, status: "PENDING" },
    }),
    prisma.payment.aggregate({
      where: { businessId, status: "COMPLETED" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        status: "COMPLETED",
        createdAt: { gte: since },
      },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { businessId },
      orderBy: { startAt: "desc" },
      take: 5,
      include: {
        court: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);

  const revenueSeries: Array<{ date: string; amount: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const dayStart = startOfDay(d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const amount = revenuePayments
      .filter((p) => p.createdAt >= dayStart && p.createdAt < dayEnd)
      .reduce((sum, p) => sum + Number(p.amountCents), 0);
    revenueSeries.push({ date: dayLabel(d), amount });
  }

  const bookingsByStatus = bookingGroups.map((g) => ({
    name: g.status,
    value: g._count._all,
  }));

  const overview = [
    { name: "Customers", value: customers },
    { name: "Bookings", value: openBookings },
    { name: "Members", value: activeMemberships },
    { name: "Payments", value: paymentsAgg._count },
  ];

  const stats: Array<{ label: string; value: string; href?: string }> = [
    {
      label: "Customers",
      value: String(customers),
      href: enabled.has("customers") ? "/app/customers" : undefined,
    },
    {
      label: "Open bookings",
      value: String(openBookings),
      href: enabled.has("bookings") ? "/app/bookings" : undefined,
    },
    {
      label: "Active members",
      value: String(activeMemberships),
      href: enabled.has("memberships") ? "/app/memberships" : undefined,
    },
    {
      label: "Pending payments",
      value: String(pendingPayments),
      href: enabled.has("payments") ? "/app/payments" : undefined,
    },
    {
      label: "Facilities / courts",
      value: `${facilities} / ${courts}`,
      href: enabled.has("facilities") ? "/app/facilities" : undefined,
    },
    {
      label: "Revenue collected",
      value: formatTenantMoney(paymentsAgg._sum.amountCents ?? 0, ctx),
      href: enabled.has("payments") ? "/app/payments" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${ctx.businessName ?? "your business"}.`}
        actions={
          enabled.has("reports") ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/app/reports">Full reports</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.href ? (
                  <Link href={stat.href} className="hover:underline">
                    {stat.label}
                  </Link>
                ) : (
                  stat.label
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts
        revenueByDay={revenueSeries}
        bookingsByStatus={bookingsByStatus}
        overview={overview}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent payments</CardTitle>
            {enabled.has("payments") ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/payments">View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {p.customer?.name ?? "Walk-in"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.createdAt.toISOString().slice(0, 10)}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatTenantMoney(p.amountCents, {
                        currency: p.currency || ctx.currency,
                        currencyDecimals: ctx.currencyDecimals,
                      })}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming / recent bookings</CardTitle>
            {enabled.has("bookings") ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/bookings">View all</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {b.customer?.name ?? "Guest"} · {b.court.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.startAt.toISOString().slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
