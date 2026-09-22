import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { EditPlanCard } from "../plan-forms";

export const metadata = { title: "Edit plan" };

export default async function AdminPlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [plan, categories, modules] = await Promise.all([
    prisma.plan.findUnique({
      where: { id },
      include: { planModules: true },
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

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={plan.name}
        description="Edit plan details, pricing, limits, and included modules."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/plans">Back to plans</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <EditPlanCard
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
            categories={categories}
            modules={modules}
          />
        </CardContent>
      </Card>
    </div>
  );
}