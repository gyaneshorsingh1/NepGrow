import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

import { CreateModuleForm } from "../module-forms";

export const metadata = { title: "New module" };

export default async function NewModulePage() {
  const categories = await prisma.businessCategory.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create module"
        description="Modules appear in plan entitlements and the tenant navigation."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateModuleForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
