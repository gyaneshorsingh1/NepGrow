import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { listAssignablePermissions } from "@/server/services/roles";

import { CreateRoleForm } from "./create-role-form";

export const metadata = { title: "New role" };

export default async function NewRolePage() {
  const ctx = await resolveTenantContext();

  try {
    await authorize(ctx, "create", "roles");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return <AccessDenied description="You need roles.create to create roles." />;
    }
    throw error;
  }

  const permissions = await listAssignablePermissions(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Role"
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
            actorPermissionKeys={ctx.permissionKeys}
            isPlatformAdmin={ctx.isPlatformAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
