"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { setClientPermissionsAction } from "@/features/clients/actions";

export type ClientPermissionOption = {
  id: string;
  key: string;
  name: string;
  moduleKey: string;
  moduleName: string;
  granted: boolean;
};

export function ClientPermissionsForm({
  businessId,
  roleId,
  permissions,
}: {
  businessId: string;
  roleId: string;
  permissions: ClientPermissionOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const grouped = React.useMemo(() => {
    const map = new Map<string, { moduleName: string; items: ClientPermissionOption[] }>();
    for (const permission of permissions) {
      const entry = map.get(permission.moduleKey) ?? {
        moduleName: permission.moduleName,
        items: [],
      };
      entry.items.push(permission);
      map.set(permission.moduleKey, entry);
    }
    return [...map.entries()];
  }, [permissions]);

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const permissionIds = fd.getAll("permissionIds").map(String);
    startTransition(async () => {
      const result = await setClientPermissionsAction({
        businessId,
        roleId,
        permissionIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Client permissions updated");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      {grouped.map(([moduleKey, group]) => (
        <div key={moduleKey}>
          <h3 className="mb-2 text-sm font-semibold capitalize">
            {group.moduleName}
          </h3>
          <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
            {group.items.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  name="permissionIds"
                  value={permission.id}
                  defaultChecked={permission.granted}
                />
                <span>{permission.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  ({permission.key})
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save permissions"}
      </Button>
    </form>
  );
}