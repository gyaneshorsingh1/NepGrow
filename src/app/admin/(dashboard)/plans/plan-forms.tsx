"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlanAction,
  deletePlanAction,
  setPlanModulesAction,
  updatePlanAction,
} from "@/features/catalog/actions";

type CategoryOption = { id: string; name: string };
type ModuleOption = { id: string; name: string; key: string };
type PlanRow = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  categoryId: string | null;
  priceCents: number;
  currency: string;
  billingInterval: "MONTHLY" | "YEARLY" | "LIFETIME";
  limits: unknown;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  moduleIds: string[];
};

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

function parseLimits(raw: string): Record<string, number> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed: unknown = JSON.parse(trimmed);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Limits must be a JSON object");
  }
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Limit "${key}" must be a number`);
    }
    result[key] = value;
  }
  return result;
}

function limitsToText(limits: unknown): string {
  if (
    typeof limits === "object" &&
    limits !== null &&
    !Array.isArray(limits)
  ) {
    return JSON.stringify(limits, null, 2);
  }
  return "{}";
}

export function CreatePlanForm({
  categories,
  modules,
}: {
  categories: CategoryOption[];
  modules: ModuleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let limits: Record<string, number>;
    try {
      limits = parseLimits(String(fd.get("limits") ?? "{}"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid limits");
      return;
    }

    startTransition(async () => {
      const result = await createPlanAction({
        name: String(fd.get("name") ?? ""),
        key: String(fd.get("key") ?? ""),
        description: emptyToUndefined(fd.get("description")),
        categoryId: emptyToUndefined(fd.get("categoryId")) ?? null,
        priceCents: Number(fd.get("price") ?? 0),
        currency: String(fd.get("currency") ?? "NPR"),
        billingInterval: String(fd.get("billingInterval") ?? "MONTHLY"),
        limits,
        status: String(fd.get("status") ?? "ACTIVE"),
        sortOrder: Number(fd.get("sortOrder") ?? 0),
        moduleIds: fd.getAll("moduleIds").map(String),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan created");
      router.push("/admin/plans");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-plan-name">Name</Label>
          <Input id="create-plan-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-key">Key</Label>
          <Input
            id="create-plan-key"
            name="key"
            placeholder="sports-starter"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="create-plan-description">Description</Label>
          <Textarea id="create-plan-description" name="description" rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-category">Category</Label>
          <Select id="create-plan-category" name="categoryId" defaultValue="">
            <option value="">Platform-wide</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-interval">Billing interval</Label>
          <Select
            id="create-plan-interval"
            name="billingInterval"
            defaultValue="MONTHLY"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="LIFETIME">Lifetime</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-price">Price</Label>
          <Input
            id="create-plan-price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
            required
            placeholder="20.1"
          />
          <p className="text-xs text-muted-foreground">
            Enter the normal amount (e.g. 20 or 20.1).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-currency">Currency</Label>
          <Input
            id="create-plan-currency"
            name="currency"
            defaultValue="NPR"
            maxLength={3}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-status">Status</Label>
          <Select id="create-plan-status" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-plan-sort">Sort order</Label>
          <Input
            id="create-plan-sort"
            name="sortOrder"
            type="number"
            defaultValue={0}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="create-plan-limits">Limits (JSON)</Label>
          <Textarea
            id="create-plan-limits"
            name="limits"
            rows={3}
            defaultValue='{"maxCustomers":500,"maxFacilities":3,"maxStaff":5}'
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Included modules</Label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox name="moduleIds" value={m.id} />
              <span>
                {m.name}{" "}
                <span className="text-muted-foreground">({m.key})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/plans">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          Create plan
        </Button>
      </div>
    </form>
  );
}

export function EditPlanCard({
  plan,
  categories,
  modules,
}: {
  plan: PlanRow;
  categories: CategoryOption[];
  modules: ModuleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let limits: Record<string, number>;
    try {
      limits = parseLimits(String(fd.get("limits") ?? "{}"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid limits");
      return;
    }

    startTransition(async () => {
      const result = await updatePlanAction({
        id: plan.id,
        name: String(fd.get("name") ?? ""),
        key: String(fd.get("key") ?? ""),
        description: emptyToUndefined(fd.get("description")) ?? null,
        categoryId: emptyToUndefined(fd.get("categoryId")) ?? null,
        priceCents: Number(fd.get("price") ?? 0),
        currency: String(fd.get("currency") ?? "NPR"),
        billingInterval: String(fd.get("billingInterval") ?? "MONTHLY"),
        limits,
        status: String(fd.get("status") ?? "ACTIVE"),
        sortOrder: Number(fd.get("sortOrder") ?? 0),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan updated");
      router.refresh();
    });
  }

  function onSaveModules(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setPlanModulesAction({
        planId: plan.id,
        moduleIds: fd.getAll("moduleIds").map(String),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan modules updated");
      router.refresh();
    });
  }

  function onDeactivate() {
    startTransition(async () => {
      const result = await deletePlanAction({ id: plan.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan deactivated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{plan.name}</p>
          <p className="text-xs text-muted-foreground">{plan.key}</p>
        </div>
        {plan.status === "ACTIVE" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onDeactivate}
          >
            Deactivate
          </Button>
        ) : null}
      </div>

      <form onSubmit={onUpdate} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`plan-name-${plan.id}`}>Name</Label>
            <Input
              id={`plan-name-${plan.id}`}
              name="name"
              defaultValue={plan.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-key-${plan.id}`}>Key</Label>
            <Input
              id={`plan-key-${plan.id}`}
              name="key"
              defaultValue={plan.key}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`plan-description-${plan.id}`}>Description</Label>
            <Textarea
              id={`plan-description-${plan.id}`}
              name="description"
              rows={2}
              defaultValue={plan.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-category-${plan.id}`}>Category</Label>
            <Select
              id={`plan-category-${plan.id}`}
              name="categoryId"
              defaultValue={plan.categoryId ?? ""}
            >
              <option value="">Platform-wide</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-interval-${plan.id}`}>Billing interval</Label>
            <Select
              id={`plan-interval-${plan.id}`}
              name="billingInterval"
              defaultValue={plan.billingInterval}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="LIFETIME">Lifetime</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-price-${plan.id}`}>Price</Label>
            <Input
              id={`plan-price-${plan.id}`}
              name="price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={plan.priceCents}
              required
              placeholder="20.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-currency-${plan.id}`}>Currency</Label>
            <Input
              id={`plan-currency-${plan.id}`}
              name="currency"
              defaultValue={plan.currency}
              maxLength={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-status-${plan.id}`}>Status</Label>
            <Select
              id={`plan-status-${plan.id}`}
              name="status"
              defaultValue={plan.status}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`plan-sort-${plan.id}`}>Sort order</Label>
            <Input
              id={`plan-sort-${plan.id}`}
              name="sortOrder"
              type="number"
              defaultValue={plan.sortOrder}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`plan-limits-${plan.id}`}>Limits (JSON)</Label>
            <Textarea
              id={`plan-limits-${plan.id}`}
              name="limits"
              rows={3}
              defaultValue={limitsToText(plan.limits)}
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Save plan
        </Button>
      </form>

      <form onSubmit={onSaveModules} className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Plan modules</h3>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="moduleIds"
                value={m.id}
                defaultChecked={plan.moduleIds.includes(m.id)}
              />
              <span>
                {m.name}{" "}
                <span className="text-muted-foreground">({m.key})</span>
              </span>
            </label>
          ))}
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Save modules
        </Button>
      </form>
    </div>
  );
}
