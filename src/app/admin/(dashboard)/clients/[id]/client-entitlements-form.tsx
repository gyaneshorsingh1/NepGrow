"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  changeClientPlanAction,
  updateClientModulesAction,
} from "@/features/clients/actions";

type PlanOption = { id: string; name: string };
type ModuleOption = { id: string; name: string; key: string; enabled: boolean };

export function ClientEntitlementsForm({
  businessId,
  plans,
  currentPlanId,
  modules,
}: {
  businessId: string;
  plans: PlanOption[];
  currentPlanId?: string | null;
  modules: ModuleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChangePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changeClientPlanAction({
        businessId,
        planId: String(fd.get("planId") ?? ""),
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
    const moduleIds = fd.getAll("moduleIds").map(String);
    startTransition(async () => {
      const result = await updateClientModulesAction({
        businessId,
        moduleIds,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Modules updated");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onChangePlan} className="space-y-3">
        <h3 className="text-sm font-semibold">Change plan</h3>
        <div className="space-y-2">
          <Label htmlFor="planId">Plan</Label>
          <Select
            id="planId"
            name="planId"
            defaultValue={currentPlanId ?? undefined}
            required
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pending} size="sm">
          Update plan
        </Button>
      </form>

      <form onSubmit={onSaveModules} className="space-y-3">
        <h3 className="text-sm font-semibold">Enabled modules</h3>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border p-3">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                name="moduleIds"
                value={m.id}
                defaultChecked={m.enabled}
              />
              <span>
                {m.name}{" "}
                <span className="text-muted-foreground">({m.key})</span>
              </span>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={pending} size="sm">
          Save modules
        </Button>
      </form>
    </div>
  );
}
