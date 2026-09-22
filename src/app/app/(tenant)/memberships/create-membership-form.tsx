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
import { Textarea } from "@/components/ui/textarea";
import { createMembershipProductAction } from "@/features/memberships/actions";
import { createMembershipProductSchema } from "@/lib/validation/schemas";

type Values = {
  name: string;
  description?: string;
  priceCents: number;
  durationDays: number;
  benefits?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export function CreateMembershipProductForm({
  currencyDecimals = 2,
}: {
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createMembershipProductSchema) as Resolver<Values>,
    defaultValues: {
      name: "",
      description: "",
      priceCents: 2000,
      durationDays: 30,
      benefits: "",
      status: "ACTIVE",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createMembershipProductAction({
      name: values.name,
      description: values.description,
      priceCents: Number(values.priceCents),
      durationDays: values.durationDays,
      benefits: values.benefits,
      status: values.status,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Membership plan created");
    router.push("/app/membership-plans");
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name</Label>
          <Input id="name" placeholder="Premium Membership" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceCents">Price</Label>
          <Input
            id="priceCents"
            type="number"
            step={step}
            min={0}
            placeholder="20.1"
            {...form.register("priceCents")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration (days)</Label>
          <Input id="durationDays" type="number" {...form.register("durationDays")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...form.register("description")} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="benefits">Benefits (one per line)</Label>
          <Textarea
            id="benefits"
            rows={3}
            placeholder={"Facility access\nMember discount"}
            {...form.register("benefits")}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/membership-plans">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
