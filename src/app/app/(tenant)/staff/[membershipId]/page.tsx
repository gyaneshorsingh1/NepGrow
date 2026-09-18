import { notFound } from "next/navigation";
import Link from "next/link";

import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import {
  getEmployee,
  listAssignableRoles,
} from "@/server/services/employees";
import { listAssignablePermissions } from "@/server/services/roles";

import { EmployeeDetailClient } from "./employee-detail-client";

export const metadata = { title: "Employee" };

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const ctx = await resolveTenantContext();

  let membership;
  try {
    membership = await getEmployee(ctx, membershipId);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return <AccessDenied description="You need users.view to open employees." />;
    }
    notFound();
  }

  const [roles, allPermissions] = await Promise.all([
    listAssignableRoles(ctx),
    listAssignablePermissions(ctx),
  ]);

  const assignableIds = new Set(allPermissions.map((p) => p.id));

  const rolePermissionsMap = new Map<
    string,
    { id: string; key: string; name: string; moduleKey: string }
  >();
  for (const mr of membership.roles) {
    for (const rp of mr.role.permissions) {
      if (assignableIds.has(rp.permission.id)) {
        rolePermissionsMap.set(rp.permission.id, rp.permission);
      }
    }
  }

  const canUpdate = ctx.ability.can("update", "users") || ctx.isPlatformAdmin;
  const canDisable =
    ctx.ability.can("disable", "users") ||
    ctx.ability.can("update", "users") ||
    ctx.isPlatformAdmin;
  const canManagePermissions =
    ctx.ability.can("manage", "permissions") ||
    ctx.ability.can("update", "users") ||
    ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title={membership.user.name}
        description={membership.user.email}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={membership.status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/app/staff">Back</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">
            Roles:{" "}
            <span className="font-medium text-foreground">
              {membership.roles.map((r) => r.role.name).join(", ") || "—"}
            </span>
          </p>
          <EmployeeDetailClient
            membershipId={membership.id}
            status={membership.status}
            roleIds={membership.roles.map((r) => r.role.id)}
            directPermissionIds={membership.permissions
              .map((p) => p.permission.id)
              .filter((id) => assignableIds.has(id))}
            rolePermissions={[...rolePermissionsMap.values()]}
            roles={roles}
            allPermissions={allPermissions.map((p) => ({
              id: p.id,
              key: p.key,
              name: p.name,
              moduleKey: p.moduleKey,
            }))}
            canUpdate={canUpdate}
            canDisable={canDisable}
            canManagePermissions={canManagePermissions}
            actorPermissionKeys={ctx.permissionKeys}
            isPlatformAdmin={ctx.isPlatformAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
