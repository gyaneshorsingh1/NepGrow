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
import { createPaymentAction } from "@/features/sports/actions";
import { createPaymentSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof createPaymentSchema>;

export function CreatePaymentForm({
  customers,
}: {
  customers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createPaymentSchema) as Resolver<Values>,
    defaultValues: {
      customerId: "",
      amountCents: 0,
      method: "cash",
      reference: "",
      notes: "",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createPaymentAction({
      ...values,
      customerId: values.customerId || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment recorded");
    form.reset({
      customerId: "",
      amountCents: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="customerId">Customer</Label>
        <Select id="customerId" {...form.register("customerId")}>
          <option value="">Optional</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amountCents">Amount (cents)</Label>
        <Input
          id="amountCents"
          type="number"
          {...form.register("amountCents")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <Select id="method" {...form.register("method")}>
          <option value="cash">Cash</option>
          <option value="esewa">eSewa</option>
          <option value="khalti">Khalti</option>
          <option value="bank">Bank</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" {...form.register("reference")} />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
