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
import { Textarea } from "@/components/ui/textarea";
import { createLeadAction, createLeadSchema } from "@/features/crm/actions";

type Values = z.infer<typeof createLeadSchema>;

export function CreateLeadForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createLeadSchema) as Resolver<Values>,
    defaultValues: { name: "", email: "", phone: "", source: "", notes: "" },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createLeadAction(businessId, values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead added successfully!");
    router.push("/app/crm");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 md:grid-cols-2 max-w-xl"
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="source">Source (e.g., Facebook, Referral)</Label>
        <Input id="source" {...form.register("source")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>
      <div className="flex gap-2 md:col-span-2 mt-4">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/crm">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add Lead"}
        </Button>
      </div>
    </form>
  );
}
