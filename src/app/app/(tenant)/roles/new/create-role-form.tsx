"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRoleAction } from "@/features/roles/actions";
import { createRoleSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";

type Values = z.output<typeof createRoleSchema>;

type PermissionOption = {
  id: string;
  key: string;
  name: string;
  moduleKey: string;
};

export function CreateRoleForm({
  permissions,
}: {
  permissions: PermissionOption[];
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

  const grouped = React.useMemo(() => {
    const map = new Map<string, PermissionOption[]>();
    for (const p of permissions) {
      const list = map.get(p.moduleKey) ?? [];
      list.push(p);
      map.set(p.moduleKey, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

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
          <Label htmlFor="name">Name</Label>
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

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Permissions</h2>
        {grouped.map(([moduleKey, perms]) => (
          <div
            key={moduleKey}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-medium capitalize">{moduleKey}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {perms.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onChange={(e) => {
                        const current = form.getValues("permissionIds");
                        form.setValue(
                          "permissionIds",
                          e.target.checked
                            ? [...current, p.id]
                            : current.filter((id) => id !== p.id),
                        );
                      }}
                    />
                    <span>
                      <span className="font-medium">{p.name}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {p.key}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create role"}
      </Button>
    </form>
  );
}
