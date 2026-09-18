"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction } from "@/features/clients/actions";
import {
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validation/schemas";

type Option = { id: string; name: string };

export function CreateClientForm({
  categories,
  plans,
  modules,
}: {
  categories: Option[];
  plans: Array<Option & { categoryId: string | null }>;
  modules: Array<Option & { categoryId: string | null; key: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as Resolver<CreateClientInput>,
    defaultValues: {
      businessName: "",
      categoryId: categories[0]?.id ?? "",
      email: "",
      phone: "",
      address: "",
      description: "",
      loginEmail: "",
      loginName: "",
      password: "",
      planId: plans[0]?.id ?? "",
      moduleIds: [],
    },
  });

  const categoryId = form.watch("categoryId");
  const filteredPlans = plans.filter(
    (p) => !p.categoryId || p.categoryId === categoryId,
  );
  const filteredModules = modules.filter(
    (m) => !m.categoryId || m.categoryId === categoryId,
  );

  async function onSubmit(values: CreateClientInput) {
    setPending(true);
    const result = await createClientAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Client created");
    router.push(`/admin/clients/${result.data.businessId}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" {...form.register("businessName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" {...form.register("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="planId">Plan</Label>
          <Select id="planId" {...form.register("planId")}>
            {filteredPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Business email</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...form.register("description")} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold">Owner login</h2>
        <div className="space-y-2">
          <Label htmlFor="loginName">Owner name</Label>
          <Input id="loginName" {...form.register("loginName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loginEmail">Login email</Label>
          <Input id="loginEmail" type="email" {...form.register("loginEmail")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Module overrides (optional)
        </h2>
        <p className="text-xs text-muted-foreground">
          Leave unchecked to use the plan defaults.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => {
            const checked = form.watch("moduleIds").includes(mod.id);
            return (
              <label
                key={mod.id}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    const current = form.getValues("moduleIds");
                    form.setValue(
                      "moduleIds",
                      e.target.checked
                        ? [...current, mod.id]
                        : current.filter((id) => id !== mod.id),
                    );
                  }}
                />
                {mod.name}
              </label>
            );
          })}
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create client"}
      </Button>
    </form>
  );
}
