import Link from "next/link";
import { format } from "date-fns";

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
import { getDashboardStats } from "@/features/dashboard/actions";
import { AlertTriangle, Info, BellRing } from "lucide-react";

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
    dashboardStats,
    customersCount,
    openBookings,
    paymentsAgg,
    recentPayments,
    bookingGroups,
    revenuePayments,
    recentBookings,
  ] = await Promise.all([
    getDashboardStats(businessId),
    prisma.customer.count({ where: { businessId } }),
    prisma.booking.count({
      where: {
        businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
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
    { name: "Customers", value: customersCount },
    { name: "Bookings", value: openBookings },
    { name: "Members", value: dashboardStats.activeMembers },
    { name: "Payments", value: paymentsAgg._count },
  ];

  const primaryStats = [
    { label: "ACTIVE MEMBERS", value: dashboardStats.activeMembers, href: "/app/memberships" },
    { label: "CHECK-INS TODAY", value: dashboardStats.checkInsToday, href: "/app/attendance" },
    { label: "CURRENTLY INSIDE", value: dashboardStats.currentlyInside, href: "/app/attendance" },
    { label: "EXPIRING THIS WEEK", value: dashboardStats.expiringThisWeek, href: "/app/memberships" },
    { label: "OVERDUE PAYMENTS", value: dashboardStats.overduePayments, href: "/app/payments" },
    { label: "NEW LEADS", value: dashboardStats.newLeads, href: "/app/crm" },
    { label: "REVENUE THIS MONTH", value: formatTenantMoney(dashboardStats.revenueThisMonthCents, ctx), href: "/app/accounting" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Good Morning 👋"
        description={`Here's what's happening at ${ctx.businessName ?? "your business"} today.`}
        actions={
          enabled.has("reports") ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/app/reports">Full reports</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {primaryStats.map((stat) => (
          <Link href={stat.href} key={stat.label} className="block transition-transform hover:scale-105 hover:-translate-y-1">
            <Card className="h-full bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <span className="text-xl md:text-2xl font-black text-foreground">{stat.value}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCharts
            revenueByDay={revenueSeries}
            bookingsByStatus={bookingsByStatus}
            overview={overview}
          />
        </div>
        
        <div className="space-y-6">
          <Card className="border-orange-200 shadow-sm bg-orange-50/30">
            <CardHeader className="pb-3 border-b border-orange-100 bg-orange-50/50">
              <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                <BellRing className="w-4 h-4 text-orange-600" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {dashboardStats.alerts.overduePayments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-orange-800 tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Overdue Payments
                  </h4>
                  {dashboardStats.alerts.overduePayments.map(p => (
                    <div key={p.id} className="text-sm flex justify-between bg-white p-2 rounded-md border border-orange-100 shadow-sm">
                      <span className="font-medium text-slate-700">{p.customer?.name}</span>
                      <span className="text-orange-600 font-medium">{formatTenantMoney(p.amountCents, ctx)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {dashboardStats.alerts.expiringMemberships.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3" /> Expiring Memberships
                  </h4>
                  {dashboardStats.alerts.expiringMemberships.map(m => (
                    <div key={m.id} className="text-sm flex justify-between bg-white p-2 rounded-md border border-slate-100 shadow-sm">
                      <span className="font-medium text-slate-700">{m.customer.name}</span>
                      <span className="text-slate-500">{format(m.endDate, "MMM d")}</span>
                    </div>
                  ))}
                </div>
              )}

              {dashboardStats.alerts.overduePayments.length === 0 && dashboardStats.alerts.expiringMemberships.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">You&apos;re all caught up!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                      {b.customer?.name ?? "Guest"} · {b.court?.name ?? "PT Session"}
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
