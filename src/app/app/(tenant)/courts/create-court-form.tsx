"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createCourtAction } from "@/features/sports/actions";
import { createCourtSchema } from "@/lib/validation/schemas";

type Values = {
  facilityId: string;
  name: string;
  capacity?: number;
  hourlyRateCents: number;
  status: "ACTIVE" | "INACTIVE";
};

export function CreateCourtForm({
  facilities,
  currencyDecimals = 2,
}: {
  facilities: Array<{ id: string; name: string }>;
  currencyDecimals?: number;
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
      status: "ACTIVE",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createCourtAction({
      facilityId: values.facilityId,
      name: values.name,
      capacity: values.capacity,
      hourlyRateCents: Number(values.hourlyRateCents),
      status: values.status,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Court created");
    router.push("/app/courts");
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 md:grid-cols-2"
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
        <Label htmlFor="hourlyRateCents">Hourly rate</Label>
        <Input
          id="hourlyRateCents"
          type="number"
          step={step}
          min={0}
          placeholder="20.1"
          {...form.register("hourlyRateCents")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...form.register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/courts">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || facilities.length === 0}>
          {pending ? "Saving…" : "Add court"}
        </Button>
      </div>
    </form>
  );
}
