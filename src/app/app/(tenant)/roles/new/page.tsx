import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/lib/db";

import { CreateRoleForm } from "./create-role-form";

export const metadata = { title: "New role" };

export default async function NewRolePage() {
  const ctx = await resolveTenantContext();
  await authorize(ctx, "create", "roles");

  const permissions = await prisma.permission.findMany({
    orderBy: [{ moduleKey: "asc" }, { key: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New role"
        description="Create a custom role with a permission matrix."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateRoleForm
            permissions={permissions.map((p) => ({
              id: p.id,
              key: p.key,
              name: p.name,
              moduleKey: p.moduleKey,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
