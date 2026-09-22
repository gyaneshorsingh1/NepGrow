<<<<<<< Updated upstream
=======
import Link from "next/link";
import { Pencil } from "lucide-react";

>>>>>>> Stashed changes
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
<<<<<<< Updated upstream
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
=======
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No plans yet.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
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
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link href={`/admin/plans/${plan.id}`}>
                        <Pencil aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
>>>>>>> Stashed changes
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
