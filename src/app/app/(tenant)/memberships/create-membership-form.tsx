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
import { createMembershipProductAction } from "@/features/sports/actions";
import { createMembershipProductSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof createMembershipProductSchema>;

export function CreateMembershipProductForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createMembershipProductSchema) as Resolver<Values>,
    defaultValues: {
      name: "",
      description: "",
      priceCents: 0,
      durationDays: 30,
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createMembershipProductAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Membership product created");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">New product</h3>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priceCents">Price (cents)</Label>
          <Input id="priceCents" type="number" {...form.register("priceCents")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration (days)</Label>
          <Input id="durationDays" type="number" {...form.register("durationDays")} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create product"}
      </Button>
    </form>
  );
}
