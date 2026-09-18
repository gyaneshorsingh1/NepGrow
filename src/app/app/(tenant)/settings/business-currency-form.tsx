"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createAndSetBusinessCurrencyAction,
  setBusinessCurrencyAction,
} from "@/features/settings/actions";

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string | null;
};

export function BusinessCurrencyForm({
  currentCode,
  currencies,
  canUpdate,
}: {
  currentCode: string;
  currencies: CurrencyOption[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canUpdate) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setBusinessCurrencyAction({
        currencyCode: String(fd.get("currencyCode") ?? ""),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Currency set to ${result.data.currency}`);
      router.refresh();
    });
  }

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canUpdate) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAndSetBusinessCurrencyAction({
        code: String(fd.get("code") ?? ""),
        name: String(fd.get("name") ?? ""),
        symbol: String(fd.get("symbol") ?? "") || undefined,
        decimals: Number(fd.get("decimals") ?? 2),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Created and selected ${result.data.currency}`);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSelect} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="currencyCode">Active currency</Label>
          <Select
            id="currencyCode"
            name="currencyCode"
            defaultValue={currentCode}
            disabled={!canUpdate || pending}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
                {c.symbol ? ` (${c.symbol})` : ""}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            All prices, payments, and reports for this business use this currency.
          </p>
        </div>
        {canUpdate ? (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save currency"}
          </Button>
        ) : null}
      </form>

      {canUpdate ? (
        <form
          onSubmit={onCreate}
          className="space-y-3 border-t border-border pt-4"
        >
          <h3 className="text-sm font-semibold">Create currency</h3>
          <p className="text-xs text-muted-foreground">
            Add a new ISO code if it is not in the list, then apply it to this
            business.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-code">Code</Label>
              <Input
                id="new-code"
                name="code"
                placeholder="USD"
                maxLength={3}
                required
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                name="name"
                placeholder="US Dollar"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-symbol">Symbol</Label>
              <Input id="new-symbol" name="symbol" placeholder="$" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-decimals">Decimals</Label>
              <Input
                id="new-decimals"
                name="decimals"
                type="number"
                min={0}
                max={4}
                defaultValue={2}
              />
            </div>
          </div>
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? "Creating…" : "Create & use"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
