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
import { Select } from "@/components/ui/select";
import {
  PermissionMatrix,
  type PermissionOption,
} from "@/components/shared/permission-matrix";
import { createEmployeeAction } from "@/features/employees/actions";
import { createEmployeeSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof createEmployeeSchema>;

export function CreateEmployeeForm({
  roles,
  permissions,
  actorPermissionKeys,
  isPlatformAdmin = false,
}: {
  roles: { id: string; name: string; key: string }[];
  permissions: PermissionOption[];
  actorPermissionKeys?: string[];
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createEmployeeSchema) as Resolver<Values>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: roles[0]?.id ?? "",
      permissionIds: [],
      status: "ACTIVE",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createEmployeeAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Employee created");
    router.push(`/app/staff/${result.data.id}`);
    router.refresh();
  }

  const selected = form.watch("permissionIds");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            {...form.register("password")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roleId">Role</Label>
          <Select id="roleId" {...form.register("roleId")}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Additional Permissions (optional)</h2>
        <p className="text-sm text-muted-foreground">
          Direct grants on top of the selected role. Additive only.
        </p>
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
          onClick={() => router.push("/app/staff")}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !roles.length}>
          {pending ? "Creating…" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
