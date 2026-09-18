import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function TenantDashboardPage() {
  const ctx = await resolveTenantContext();

  const [customers, bookings, facilities, paymentsAgg] = await Promise.all([
    prisma.customer.count({ where: { businessId: ctx.businessId } }),
    prisma.booking.count({
      where: {
        businessId: ctx.businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.facility.count({ where: { businessId: ctx.businessId } }),
    prisma.payment.aggregate({
      where: { businessId: ctx.businessId, status: "COMPLETED" },
      _sum: { amountCents: true },
      _count: true,
    }),
  ]);

  const stats = [
    { label: "Customers", value: String(customers) },
    { label: "Open bookings", value: String(bookings) },
    { label: "Facilities", value: String(facilities) },
    {
      label: "Revenue collected",
      value: formatMoney(paymentsAgg._sum.amountCents ?? 0),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Snapshot of your sports center operations."
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
