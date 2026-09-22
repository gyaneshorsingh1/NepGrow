"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PermissionMatrix,
  type PermissionOption,
} from "@/components/shared/permission-matrix";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteRoleAction, updateRoleAction } from "@/features/roles/actions";
import { updateRoleSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof updateRoleSchema>;

export function EditRoleForm({
  role,
  permissions,
  canUpdate,
  canDelete,
  actorPermissionKeys,
  isPlatformAdmin = false,
}: {
  role: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    isSystem: boolean;
    permissionIds: string[];
    memberCount: number;
  };
  permissions: PermissionOption[];
  canUpdate: boolean;
  canDelete: boolean;
  actorPermissionKeys?: string[];
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(updateRoleSchema) as Resolver<Values>,
    defaultValues: {
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      permissionIds: role.permissionIds,
    },
  });

  React.useEffect(() => {
    form.reset({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      permissionIds: role.permissionIds,
    });
  }, [role, form]);

  async function onSubmit(values: Values) {
    if (!canUpdate) return;
    setPending(true);
    const result = await updateRoleAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function onDelete() {
    const result = await deleteRoleAction({ id: role.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Role deleted");
    router.push("/app/roles");
    router.refresh();
  }

  const selected = form.watch("permissionIds");

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              disabled={!canUpdate || pending}
            />
          </div>
          <div className="space-y-2">
            <Label>Key</Label>
            <Input value={role.key} disabled />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              {...form.register("description")}
              disabled={!canUpdate || pending}
            />
          </div>
        </div>

        {role.isSystem ? (
          <p className="text-sm text-muted-foreground">
            This is a system role. Deleting it is not allowed.
          </p>
        ) : null}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Permissions</h2>
          <PermissionMatrix
            permissions={permissions}
            value={selected}
            onChange={(ids) => form.setValue("permissionIds", ids)}
            disabled={!canUpdate || pending}
            actorPermissionKeys={actorPermissionKeys}
            isPlatformAdmin={isPlatformAdmin}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/app/roles")}
            disabled={pending}
          >
            Back
          </Button>
          {canUpdate ? (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          ) : null}
          {canDelete && !role.isSystem ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pending || role.memberCount > 0}
              onClick={() => setConfirmOpen(true)}
              title={
                role.memberCount > 0
                  ? "Unassign users before deleting"
                  : undefined
              }
            >
              Delete role
            </Button>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete role?"
        description="This cannot be undone. Users must be unassigned first."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
