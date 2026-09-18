import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { CreateClientForm } from "./create-client-form";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  const [categories, plans, modules] = await Promise.all([
    prisma.businessCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New client"
        description="Provision a business, owner login, plan, and website."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateClientForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              categoryId: p.categoryId,
            }))}
            modules={modules.map((m) => ({
              id: m.id,
              name: m.name,
              categoryId: m.categoryId,
              key: m.key,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
