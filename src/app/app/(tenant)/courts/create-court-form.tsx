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
import { createCourtAction } from "@/features/sports/actions";
import { createCourtSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof createCourtSchema>;

export function CreateCourtForm({
  facilities,
}: {
  facilities: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createCourtSchema) as Resolver<Values>,
    defaultValues: {
      facilityId: facilities[0]?.id ?? "",
      name: "",
      capacity: undefined,
      hourlyRateCents: 0,
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createCourtAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Court created");
    form.reset({
      facilityId: facilities[0]?.id ?? "",
      name: "",
      capacity: undefined,
      hourlyRateCents: 0,
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="facilityId">Facility</Label>
        <Select id="facilityId" {...form.register("facilityId")}>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Court name</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...form.register("capacity")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hourlyRateCents">Hourly rate (cents)</Label>
        <Input
          id="hourlyRateCents"
          type="number"
          {...form.register("hourlyRateCents")}
        />
      </div>
      <div>
        <Button type="submit" disabled={pending || facilities.length === 0}>
          {pending ? "Saving…" : "Add court"}
        </Button>
      </div>
    </form>
  );
}
