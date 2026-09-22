import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { CreateClientForm } from "./create-client-form";

export const metadata = { title: "New Client / Business" };

export default async function NewClientPage() {
  const [categories, subcategories, plans, modules, currencies] =
    await Promise.all([
      prisma.businessCategory.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prisma.businessSubcategory.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prisma.plan.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.currency.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: { code: true, name: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Client / Business"
        description="Provision a business, owner login, plan, and website."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateClientForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            subcategories={subcategories.map((s) => ({
              id: s.id,
              name: s.name,
              categoryId: s.categoryId,
            }))}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              categoryId: p.categoryId,
            }))}
            modules={modules.map((m) => ({
              id: m.id,
              name: m.name,
              key: m.key,
              categoryId: m.categoryId,
            }))}
            currencies={
              currencies.length
                ? currencies
                : [{ code: "NPR", name: "Nepalese Rupee" }]
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
