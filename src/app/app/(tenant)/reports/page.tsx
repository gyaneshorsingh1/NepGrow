import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { formatMoney } from "@/lib/utils";
import { getSportsReport } from "@/server/services/sports";

import { ReportsCharts } from "./reports-charts";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const ctx = await resolveTenantContext();
  const report = await getSportsReport(ctx);

  const chartData = [
    { name: "Customers", value: report.customers },
    { name: "Bookings", value: report.bookings },
    { name: "Payments", value: report.payments },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="High-level performance for your sports center."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {report.customers}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {report.bookings}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {report.payments}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(report.revenueCents)}
          </CardContent>
        </Card>
      </div>
      <ReportsCharts data={chartData} />
    </div>
  );
}
