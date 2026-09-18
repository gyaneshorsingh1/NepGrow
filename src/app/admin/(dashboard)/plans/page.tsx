import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    include: {
      category: true,
      planModules: true,
      _count: { select: { subscriptions: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Subscription plans available to client businesses."
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.key}</p>
                  </div>
                </TableCell>
                <TableCell>{plan.category?.name ?? "—"}</TableCell>
                <TableCell>
                  {formatMoney(plan.priceCents, plan.currency)} /{" "}
                  {plan.billingInterval.toLowerCase()}
                </TableCell>
                <TableCell>{plan.planModules.length}</TableCell>
                <TableCell>{plan._count.subscriptions}</TableCell>
                <TableCell>
                  <StatusBadge status={plan.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
