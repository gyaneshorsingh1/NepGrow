import { notFound } from "next/navigation";

import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import {
  getBusinessRole,
  listAssignablePermissions,
} from "@/server/services/roles";

import { EditRoleForm } from "./edit-role-form";

export const metadata = { title: "Edit role" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await resolveTenantContext();

  let role;
  try {
    role = await getBusinessRole(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return <AccessDenied description="You need roles.view to edit roles." />;
    }
    notFound();
  }

  const permissions = await listAssignablePermissions(ctx);
  const assignableIds = new Set(permissions.map((p) => p.id));
  const permissionIds = role.permissions
    .map((p) => p.permission.id)
    .filter((pid) => assignableIds.has(pid));

  const canUpdate = ctx.ability.can("update", "roles") || ctx.isPlatformAdmin;
  const canDelete = ctx.ability.can("delete", "roles") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description={`Edit permissions for ${role.key}${role.isSystem ? " (system)" : ""}.`}
      />
      <Card>
        <CardContent className="pt-6">
          <EditRoleForm
            role={{
              id: role.id,
              name: role.name,
              key: role.key,
              description: role.description,
              isSystem: role.isSystem,
              permissionIds,
              memberCount: role._count.memberships,
            }}
            permissions={permissions.map((p) => ({
              id: p.id,
              key: p.key,
              name: p.name,
              moduleKey: p.moduleKey,
            }))}
            canUpdate={canUpdate}
            canDelete={canDelete}
            actorPermissionKeys={ctx.permissionKeys}
            isPlatformAdmin={ctx.isPlatformAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
