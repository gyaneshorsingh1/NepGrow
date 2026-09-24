"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCheckInAction } from "@/features/attendance/actions";
import { checkInSchema } from "@/features/attendance/schemas";

type Values = z.infer<typeof checkInSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
}

export function CreateCheckInForm({
  businessId,
  customers,
  facilities,
}: {
  businessId: string;
  customers: Customer[];
  facilities: Facility[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(checkInSchema) as Resolver<Values>,
    defaultValues: { customerId: "", facilityId: "", notes: "" },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createCheckInAction(businessId, values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Check-in successful");
    router.push("/app/attendance");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 md:grid-cols-2 max-w-xl"
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customerId">Customer</Label>
        <Select id="customerId" {...form.register("customerId")}>
          <option value="" disabled>Select a customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {form.formState.errors.customerId && (
          <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
        )}
      </div>
      
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="facilityId">Facility (Optional)</Label>
        <Select id="facilityId" {...form.register("facilityId")}>
          <option value="">None (General Entry)</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} placeholder="Optional notes for this visit..." />
      </div>

      <div className="flex gap-2 md:col-span-2 mt-4">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/attendance">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Checking in…" : "Check In"}
        </Button>
      </div>
    </form>
  );
}
