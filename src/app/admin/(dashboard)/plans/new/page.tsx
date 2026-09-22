import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { CreatePlanForm } from "../plan-forms";

export const metadata = { title: "New plan" };

export default async function NewPlanPage() {
  const [categories, modules] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create plan"
        description="New plans become available when creating or updating client businesses."
      />
      <Card>
        <CardContent className="pt-6">
          <CreatePlanForm categories={categories} modules={modules} />
        </CardContent>
      </Card>
    </div>
  );
}
