"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFacilityAction } from "@/features/sports/actions";
import { createFacilitySchema } from "@/lib/validation/schemas";

type Values = z.output<typeof createFacilitySchema>;

export function CreateFacilityForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createFacilitySchema) as Resolver<Values>,
    defaultValues: { name: "", sport: "", description: "", status: "ACTIVE" },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createFacilityAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Facility created");
    router.push("/app/facilities");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sport">Sport</Label>
        <Input id="sport" placeholder="Futsal, badminton…" {...form.register("sport")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...form.register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={2} {...form.register("description")} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/facilities">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add facility"}
        </Button>
      </div>
    </form>
  );
}
