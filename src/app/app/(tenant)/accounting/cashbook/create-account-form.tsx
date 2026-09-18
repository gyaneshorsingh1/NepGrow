"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCashbookAccountAction } from "@/features/accounting/actions";
import { createCashbookAccountSchema } from "@/lib/validation/schemas";

type Values = {
  name: string;
  openingBalanceCents: number;
  notes?: string;
};

export function CreateAccountForm({
  currencyDecimals = 2,
}: {
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createCashbookAccountSchema) as Resolver<Values>,
    defaultValues: {
      name: "",
      openingBalanceCents: 0,
      notes: "",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createCashbookAccountAction({
      name: values.name,
      openingBalanceCents: Number(values.openingBalanceCents),
      notes: values.notes || undefined,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Account created");
    form.reset({
      name: "",
      openingBalanceCents: 0,
      notes: "",
    });
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Account name</Label>
        <Input
          id="name"
          placeholder="Main cash drawer"
          {...form.register("name")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="openingBalanceCents">Opening balance</Label>
        <Input
          id="openingBalanceCents"
          type="number"
          step={step}
          {...form.register("openingBalanceCents")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...form.register("notes")} />
      </div>
      <div className="md:col-span-2 xl:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add account"}
        </Button>
      </div>
    </form>
  );
}
