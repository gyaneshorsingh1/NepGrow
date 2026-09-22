<<<<<<< HEAD
<<<<<<< Updated upstream
=======
import Link from "next/link";
import { Pencil } from "lucide-react";

>>>>>>> Stashed changes
=======
import Link from "next/link";

>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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

import { EditPlanCard } from "./plan-forms";

export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const [plans, categories, modules] = await Promise.all([
    prisma.plan.findMany({
      include: {
        category: true,
        planModules: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.businessCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.module.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, key: true },
    }),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  const moduleOptions = modules.map((m) => ({
    id: m.id,
    name: m.name,
    key: m.key,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Create and manage subscription plans and their included modules."
        actions={
          <Button asChild>
            <Link href="/admin/plans/new">+ Create Plan</Link>
          </Button>
        }
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
<<<<<<< HEAD
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
=======
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No plans yet.
                </TableCell>
              </TableRow>
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
<<<<<<< HEAD
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
=======
                </TableRow>
              ))
            )}
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit plans</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => (
            <EditPlanCard
              key={plan.id}
              plan={{
                id: plan.id,
                name: plan.name,
                key: plan.key,
                description: plan.description,
                categoryId: plan.categoryId,
                priceCents: plan.priceCents,
                currency: plan.currency,
                billingInterval: plan.billingInterval,
                limits: plan.limits,
                status: plan.status,
                sortOrder: plan.sortOrder,
                moduleIds: plan.planModules.map((pm) => pm.moduleId),
              }}
              categories={categoryOptions}
              modules={moduleOptions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
