"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createCurrencyAction,
  updateCurrencyAction,
} from "@/features/currencies/actions";

type CurrencyRow = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  decimals: number;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
};

export function CreateCurrencyForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCurrencyAction({
        code: String(fd.get("code") ?? ""),
        name: String(fd.get("name") ?? ""),
        symbol: String(fd.get("symbol") ?? "") || undefined,
        decimals: Number(fd.get("decimals") ?? 2),
        status: String(fd.get("status") ?? "ACTIVE"),
        sortOrder: Number(fd.get("sortOrder") ?? 100),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Currency ${result.data.code} created`);
      router.push("/admin/currencies");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="code">Code (ISO 4217)</Label>
        <Input
          id="code"
          name="code"
          placeholder="NPR"
          maxLength={3}
          required
          className="uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Nepalese Rupee" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="symbol">Symbol</Label>
        <Input id="symbol" name="symbol" placeholder="Rs." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="decimals">Decimal places</Label>
        <Input
          id="decimals"
          name="decimals"
          type="number"
          min={0}
          max={4}
          defaultValue={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={100} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/currencies">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create currency"}
        </Button>
      </div>
    </form>
  );
}

export function EditCurrencyCard({ currency }: { currency: CurrencyRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCurrencyAction({
        id: currency.id,
        name: String(fd.get("name") ?? ""),
        symbol: String(fd.get("symbol") ?? "") || null,
        decimals: Number(fd.get("decimals") ?? 2),
        status: String(fd.get("status") ?? "ACTIVE"),
        sortOrder: Number(fd.get("sortOrder") ?? 0),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Currency updated");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold">{currency.code}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`name-${currency.id}`}>Name</Label>
          <Input
            id={`name-${currency.id}`}
            name="name"
            defaultValue={currency.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`symbol-${currency.id}`}>Symbol</Label>
          <Input
            id={`symbol-${currency.id}`}
            name="symbol"
            defaultValue={currency.symbol ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`decimals-${currency.id}`}>Decimals</Label>
          <Input
            id={`decimals-${currency.id}`}
            name="decimals"
            type="number"
            min={0}
            max={4}
            defaultValue={currency.decimals}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`status-${currency.id}`}>Status</Label>
          <Select
            id={`status-${currency.id}`}
            name="status"
            defaultValue={currency.status}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sort-${currency.id}`}>Sort order</Label>
          <Input
            id={`sort-${currency.id}`}
            name="sortOrder"
            type="number"
            defaultValue={currency.sortOrder}
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
