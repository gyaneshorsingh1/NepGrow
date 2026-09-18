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
import { createRoleAction } from "@/features/roles/actions";
import { createRoleSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";

type Values = z.output<typeof createRoleSchema>;

export function CreateRoleForm({
  permissions,
  actorPermissionKeys,
  isPlatformAdmin = false,
}: {
  permissions: PermissionOption[];
  actorPermissionKeys?: string[];
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createRoleSchema) as Resolver<Values>,
    defaultValues: {
      name: "",
      key: "",
      description: "",
      permissionIds: [],
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createRoleAction({
      ...values,
      key: values.key || slugify(values.name),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Role created");
    router.push("/app/roles");
    router.refresh();
  }

  const selected = form.watch("permissionIds");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            onBlur={(e) => {
              if (!form.getValues("key")) {
                form.setValue("key", slugify(e.target.value));
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key">Key</Label>
          <Input id="key" {...form.register("key")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...form.register("description")} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Permissions</h2>
        <PermissionMatrix
          permissions={permissions}
          value={selected}
          onChange={(ids) => form.setValue("permissionIds", ids)}
          disabled={pending}
          actorPermissionKeys={actorPermissionKeys}
          isPlatformAdmin={isPlatformAdmin}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/app/roles")}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
