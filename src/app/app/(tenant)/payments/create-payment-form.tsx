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
import { createPaymentAction } from "@/features/sports/actions";
import { createPaymentSchema } from "@/lib/validation/schemas";

type Values = {
  customerId?: string;
  bookingId?: string;
  membershipId?: string;
  amountCents: number;
  method?: string;
  reference?: string;
  notes?: string;
  cashbookAccountId?: string;
};

export function CreatePaymentForm({
  customers,
  accounts,
  currencyDecimals = 2,
}: {
  customers: Array<{ id: string; name: string }>;
  accounts: Array<{ id: string; name: string }>;
  currencyDecimals?: number;
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
      cashbookAccountId: accounts[0]?.id ?? "",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createPaymentAction({
      customerId: values.customerId || undefined,
      amountCents: Number(values.amountCents),
      method: values.method,
      reference: values.reference,
      notes: values.notes,
      bookingId: values.bookingId,
      membershipId: values.membershipId,
      cashbookAccountId: values.cashbookAccountId || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment recorded");
    router.push("/app/payments");
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
        <Label htmlFor="amountCents">Amount</Label>
        <Input
          id="amountCents"
          type="number"
          step={step}
          min={0}
          placeholder="20.1"
          {...form.register("amountCents")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cashbookAccountId">Cashbook account</Label>
        <Select id="cashbookAccountId" {...form.register("cashbookAccountId")}>
          {accounts.length === 0 ? (
            <option value="">No accounts — create one first</option>
          ) : (
            accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))
          )}
        </Select>
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
      <div className="flex gap-2 md:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/payments">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
