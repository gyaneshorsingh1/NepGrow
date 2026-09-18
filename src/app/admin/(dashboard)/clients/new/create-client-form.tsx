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
import { BUSINESS_MODEL_OPTIONS } from "@/lib/business-models";
import {
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validation/schemas";

type Option = { id: string; name: string };

export function CreateClientForm({
  categories,
  subcategories,
  plans,
  modules,
  currencies,
}: {
  categories: Option[];
  subcategories: Array<Option & { categoryId: string }>;
  plans: Array<Option & { categoryId: string | null }>;
  modules: Array<Option & { categoryId: string | null; key: string }>;
  currencies: Array<{ code: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as Resolver<CreateClientInput>,
    defaultValues: {
      businessName: "",
      categoryId: categories[0]?.id ?? "",
      subcategoryId: "",
      businessModels: ["booking", "time_based_usage"],
      email: "",
      phone: "",
      address: "",
      description: "",
      status: "ACTIVE",
      currency: currencies[0]?.code ?? "NPR",
      loginEmail: "",
      loginName: "",
      password: "",
      planId: plans[0]?.id ?? "",
      moduleIds: [],
    },
  });

  const categoryId = form.watch("categoryId");
  const businessModels = form.watch("businessModels") ?? [];
  const moduleIds = form.watch("moduleIds") ?? [];

  const filteredSubcategories = subcategories.filter(
    (s) => s.categoryId === categoryId,
  );
  const filteredPlans = plans.filter(
    (p) => !p.categoryId || p.categoryId === categoryId,
  );
  const filteredModules = modules.filter(
    (m) => !m.categoryId || m.categoryId === categoryId,
  );

  React.useEffect(() => {
    const currentSub = form.getValues("subcategoryId");
    if (
      currentSub &&
      !filteredSubcategories.some((s) => s.id === currentSub)
    ) {
      form.setValue("subcategoryId", "");
    }
    const currentPlan = form.getValues("planId");
    if (filteredPlans.length && !filteredPlans.some((p) => p.id === currentPlan)) {
      form.setValue("planId", filteredPlans[0]?.id ?? "");
    }
  }, [categoryId, filteredSubcategories, filteredPlans, form]);

  async function onSubmit(values: CreateClientInput) {
    setPending(true);
    const result = await createClientAction({
      ...values,
      subcategoryId: values.subcategoryId || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Client created");
    router.push(`/admin/clients/${result.data.businessId}`);
    router.refresh();
  }

  function toggleModel(key: (typeof BUSINESS_MODEL_OPTIONS)[number]["key"]) {
    const current = form.getValues("businessModels") ?? [];
    form.setValue(
      "businessModels",
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    );
  }

  function toggleModule(id: string) {
    const current = form.getValues("moduleIds") ?? [];
    form.setValue(
      "moduleIds",
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">
            Business Information
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Profile details for the client business.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              placeholder="ABC Sports Center"
              {...form.register("businessName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Business Category</Label>
            <Select id="categoryId" {...form.register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategoryId">Business Subcategory</Label>
            <Select id="subcategoryId" {...form.register("subcategoryId")}>
              <option value="">Select…</option>
              {filteredSubcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Business Model</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BUSINESS_MODEL_OPTIONS.map((opt) => {
                const checked = businessModels.includes(opt.key);
                return (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleModel(opt.key)}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Business Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" {...form.register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" {...form.register("currency")}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              {...form.register("description")}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">Owner Login</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Credentials for the business owner account.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="loginName">Owner Name</Label>
            <Input id="loginName" {...form.register("loginName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginEmail">Login Email</Label>
            <Input
              id="loginEmail"
              type="email"
              {...form.register("loginEmail")}
            />
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
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">
            Subscription Plan
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Plan automatically determines available modules, usage limits, staff
            limits, branch limits, and other plan restrictions.
          </p>
        </div>
        <div className="max-w-md space-y-2">
          <Label htmlFor="planId">Plan</Label>
          <Select id="planId" {...form.register("planId")}>
            {filteredPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">
            Module Overrides (Optional)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use plan defaults unless manually overridden.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => {
            const checked = moduleIds.includes(mod.id);
            return (
              <label
                key={mod.id}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onChange={() => toggleModule(mod.id)}
                />
                {mod.name}
              </label>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
