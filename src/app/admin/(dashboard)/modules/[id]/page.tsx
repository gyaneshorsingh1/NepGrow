import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { EditModuleCard } from "../module-forms";

export const metadata = { title: "Edit module" };

export default async function AdminModuleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [mod, categories] = await Promise.all([
    prisma.module.findUnique({ where: { id } }),
    prisma.businessCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!mod) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={mod.name}
        description="Edit module details, category, and navigation mapping."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/modules">Back to modules</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <EditModuleCard
            module={{
              id: mod.id,
              key: mod.key,
              name: mod.name,
              description: mod.description,
              categoryId: mod.categoryId,
              isCore: mod.isCore,
              sortOrder: mod.sortOrder,
              icon: mod.icon,
              href: mod.href,
            }}
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}