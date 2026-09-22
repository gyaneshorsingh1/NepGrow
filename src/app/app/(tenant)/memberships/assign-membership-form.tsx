"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { assignMembershipAction } from "@/features/memberships/actions";
import { formatMoney } from "@/lib/utils";

export function AssignMembershipForm({
  customers,
  products,
  accounts,
  currency,
  currencyDecimals = 2,
}: {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; priceCents: number; durationDays: number }[];
  accounts: { id: string; name: string }[];
  currency: string;
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await assignMembershipAction({
        customerId: String(fd.get("customerId") ?? ""),
        productId: String(fd.get("productId") ?? ""),
        startDate: String(fd.get("startDate") ?? "") || undefined,
        paymentStatus: String(fd.get("paymentStatus") ?? "COMPLETED"),
        paymentMethod: String(fd.get("paymentMethod") ?? "") || "cash",
        cashbookAccountId: String(fd.get("cashbookAccountId") ?? "") || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Membership assigned");
      router.push("/app/memberships");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="customerId">Customer</Label>
        <Select id="customerId" name="customerId" required>
          <option value="">Select…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="productId">Plan</Label>
        <Select id="productId" name="productId" required>
          <option value="">Select…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatMoney(p.priceCents, currency, currencyDecimals)} /{" "}
              {p.durationDays}d
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentStatus">Payment status</Label>
        <Select id="paymentStatus" name="paymentStatus" defaultValue="COMPLETED">
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment method</Label>
        <Select id="paymentMethod" name="paymentMethod" defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="esewa">eSewa</option>
          <option value="khalti">Khalti</option>
          <option value="bank">Bank</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cashbookAccountId">Cashbook account</Label>
        <Select id="cashbookAccountId" name="cashbookAccountId">
          <option value="">Select…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/memberships">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || !products.length}>
          {pending ? "Assigning…" : "Assign membership"}
        </Button>
      </div>
    </form>
  );
}
