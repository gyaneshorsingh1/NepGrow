"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  PermissionMatrix,
  type PermissionOption,
} from "@/components/shared/permission-matrix";
import {
  setEmployeeDirectPermissionsAction,
  setEmployeeStatusAction,
  updateEmployeeRolesAction,
} from "@/features/employees/actions";

type RoleOption = { id: string; name: string; key: string };

type Perm = {
  id: string;
  key: string;
  name: string;
  moduleKey: string;
};

export function EmployeeDetailClient({
  membershipId,
  status,
  roleIds,
  directPermissionIds,
  rolePermissions,
  roles,
  allPermissions,
  canUpdate,
  canDisable,
  canManagePermissions,
  actorPermissionKeys,
  isPlatformAdmin = false,
}: {
  membershipId: string;
  status: string;
  roleIds: string[];
  directPermissionIds: string[];
  rolePermissions: Perm[];
  roles: RoleOption[];
  allPermissions: PermissionOption[];
  canUpdate: boolean;
  canDisable: boolean;
  canManagePermissions: boolean;
  actorPermissionKeys?: string[];
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState(
    roleIds[0] ?? roles[0]?.id ?? "",
  );
  const [directIds, setDirectIds] = React.useState(directPermissionIds);

  React.useEffect(() => {
    setDirectIds(directPermissionIds);
  }, [directPermissionIds]);

  async function saveRole() {
    if (!canUpdate || !selectedRoleId) return;
    setPending(true);
    const result = await updateEmployeeRolesAction({
      membershipId,
      roleIds: [selectedRoleId],
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function saveDirect() {
    if (!canManagePermissions) return;
    setPending(true);
    const result = await setEmployeeDirectPermissionsAction({
      membershipId,
      permissionIds: directIds,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Direct permissions updated");
    router.refresh();
  }

  const [selectedStatus, setSelectedStatus] = React.useState(status);

  React.useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  async function saveStatus() {
    if (!canDisable) return;
    if (selectedStatus === status) return;
    setPending(true);
    const result = await setEmployeeStatusAction({
      membershipId,
      status: selectedStatus as "ACTIVE" | "DISABLED",
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      selectedStatus === "ACTIVE" ? "Employee activated" : "Employee disabled",
    );
    router.refresh();
  }

  const rolePermKeys = new Set(rolePermissions.map((p) => p.key));

  const groupedRole = React.useMemo(() => {
    const map = new Map<string, Perm[]>();
    for (const p of rolePermissions) {
      const list = map.get(p.moduleKey) ?? [];
      list.push(p);
      map.set(p.moduleKey, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rolePermissions]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Role</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2 sm:min-w-[220px]">
            <Label htmlFor="roleId">Assigned role</Label>
            <Select
              id="roleId"
              value={selectedRoleId}
              disabled={!canUpdate || pending}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          {canUpdate ? (
            <Button type="button" onClick={saveRole} disabled={pending}>
              Change role
            </Button>
          ) : null}
        </div>
      </section>

      {canDisable ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Status</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2 sm:min-w-[220px]">
              <Label htmlFor="employee-status">Membership status</Label>
              <Select
                id="employee-status"
                value={selectedStatus}
                disabled={pending}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={saveStatus}
              disabled={pending || selectedStatus === status}
            >
              Save status
            </Button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Role permissions (inherited)</h2>
        {groupedRole.length === 0 ? (
          <p className="text-sm text-muted-foreground">No role permissions.</p>
        ) : (
          groupedRole.map(([moduleKey, perms]) => (
            <div
              key={moduleKey}
              className="rounded-xl border border-border bg-card p-4"
            >
              <h3 className="mb-2 text-sm font-medium capitalize">{moduleKey}</h3>
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((p) => (
                  <li key={p.id} className="text-sm">
                    ✓ {p.name}{" "}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {p.key}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Direct permissions</h2>
        <p className="text-sm text-muted-foreground">
          Extra grants beyond the role. Keys already on the role are still listed
          here if also assigned directly.
        </p>
        {canManagePermissions ? (
          <>
            <PermissionMatrix
              permissions={allPermissions}
              value={directIds}
              onChange={setDirectIds}
              disabled={pending}
              actorPermissionKeys={actorPermissionKeys}
              isPlatformAdmin={isPlatformAdmin}
            />
            <Button type="button" onClick={saveDirect} disabled={pending}>
              Manage Permissions
            </Button>
          </>
        ) : (
          <ul className="text-sm">
            {allPermissions
              .filter((p) => directPermissionIds.includes(p.id))
              .map((p) => (
                <li key={p.id}>
                  ✓ {p.name}
                  {rolePermKeys.has(p.key) ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (also on role)
                    </span>
                  ) : null}
                </li>
              ))}
            {!directPermissionIds.length ? (
              <li className="text-muted-foreground">No direct permissions.</li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}
