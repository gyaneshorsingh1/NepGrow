import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const [
    clientCount,
    activeClients,
    activeSubs,
    trialSubs,
    planCount,
    moduleCount,
    recentActivity,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.plan.count(),
    prisma.module.count(),
    prisma.activityLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const stats = [
    { label: "Clients", value: clientCount },
    { label: "Active clients", value: activeClients },
    { label: "Active subscriptions", value: activeSubs },
    { label: "Trial subscriptions", value: trialSubs },
    { label: "Plans", value: planCount },
    { label: "Modules", value: moduleCount },
    { label: "Activity (7d)", value: recentActivity },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview across clients, plans, and activity."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
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
    </div>
  );
}
