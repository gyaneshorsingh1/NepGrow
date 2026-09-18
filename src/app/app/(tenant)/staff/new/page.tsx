import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { listAssignableRoles } from "@/server/services/employees";
import { listAssignablePermissions } from "@/server/services/roles";

import { CreateEmployeeForm } from "./create-employee-form";

export const metadata = { title: "Create Employee" };

export default async function CreateEmployeePage() {
  const ctx = await resolveTenantContext();
  try {
    await authorize(ctx, "create", "users");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need users.create to add employees." />
      );
    }
    throw error;
  }

  const [roles, permissions] = await Promise.all([
    listAssignableRoles(ctx),
    listAssignablePermissions(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Employee"
        description="Create an app login with a role and optional direct permissions."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateEmployeeForm
            roles={roles}
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
