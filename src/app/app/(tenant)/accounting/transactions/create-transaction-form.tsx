"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createAccountingTransactionAction } from "@/features/accounting/actions";
import { createAccountingTransactionSchema } from "@/lib/validation/schemas";

type Values = {
  accountId: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  category?: string;
  description?: string;
  reference?: string;
  occurredAt?: string;
};

export function CreateTransactionForm({
  accounts,
  currencyDecimals = 2,
}: {
  accounts: Array<{ id: string; name: string }>;
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<Values>({
    resolver: zodResolver(createAccountingTransactionSchema) as Resolver<Values>,
    defaultValues: {
      accountId: accounts[0]?.id ?? "",
      type: "INCOME",
      amountCents: 0,
      category: "",
      description: "",
      reference: "",
      occurredAt: today,
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createAccountingTransactionAction({
      accountId: values.accountId,
      type: values.type,
      amountCents: Number(values.amountCents),
      category: values.category || undefined,
      description: values.description || undefined,
      reference: values.reference || undefined,
      occurredAt: values.occurredAt
        ? new Date(values.occurredAt).toISOString()
        : undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaction recorded");
    form.reset({
      accountId: values.accountId,
      type: values.type,
      amountCents: 0,
      category: "",
      description: "",
      reference: "",
      occurredAt: today,
    });
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  if (!accounts.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a cashbook account first before recording transactions.
      </p>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="accountId">Account</Label>
        <Select id="accountId" {...form.register("accountId")}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select id="type" {...form.register("type")}>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amountCents">Amount</Label>
        <Input
          id="amountCents"
          type="number"
          step={step}
          min={0}
          {...form.register("amountCents")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="occurredAt">Date</Label>
        <Input
          id="occurredAt"
          type="date"
          {...form.register("occurredAt")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g. Court rental"
          {...form.register("category")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input
          id="reference"
          placeholder="Optional"
          {...form.register("reference")}
        />
      </div>
      <div className="space-y-2 md:col-span-2 xl:col-span-3">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Optional notes"
          {...form.register("description")}
        />
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record transaction"}
        </Button>
      </div>
    </form>
  );
}
