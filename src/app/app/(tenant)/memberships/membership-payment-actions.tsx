"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  completeMembershipPaymentAction,
  refundMembershipPaymentAction,
} from "@/features/memberships/actions";
import { formatMoney } from "@/lib/utils";

export function MembershipPaymentActions({
  membershipId,
  paymentId,
  paymentStatus,
  amount,
  currency,
  currencyDecimals = 2,
  accounts,
  canPay,
  canRefund,
}: {
  membershipId: string;
  paymentId: string | null;
  paymentStatus: string | null;
  amount: number;
  currency: string;
  currencyDecimals?: number;
  accounts: Array<{ id: string; name: string }>;
  canPay: boolean;
  canRefund: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = React.useState(false);
  const [method, setMethod] = React.useState("cash");
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");

  const showMakePayment = canPay && paymentId && paymentStatus === "PENDING";
  const showRefund = canRefund && paymentId && paymentStatus === "COMPLETED";

  if (!showMakePayment && !showRefund) return null;

  function onConfirmPay() {
    startTransition(async () => {
      const result = await completeMembershipPaymentAction({
        membershipId,
        paymentMethod: method,
        cashbookAccountId: accountId || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment completed");
      setPayOpen(false);
      router.refresh();
    });
  }

  function onRefund() {
    if (!paymentId) return;
    startTransition(async () => {
      const result = await refundMembershipPaymentAction({ paymentId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment refunded");
      router.refresh();
    });
  }

  return (
    <>
      {showMakePayment ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setPayOpen(true)}
        >
          Make payment
        </Button>
      ) : null}
      {showRefund ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onRefund}
        >
          {pending ? "…" : "Refund"}
        </Button>
      ) : null}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make payment</DialogTitle>
            <DialogDescription>
              Full plan amount only — partial payments are not allowed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor={`amount-${membershipId}`}>Amount</Label>
              <Input
                id={`amount-${membershipId}`}
                type="text"
                readOnly
                disabled
                value={formatMoney(amount, currency, currencyDecimals)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`method-${membershipId}`}>Payment method</Label>
              <Select
                id={`method-${membershipId}`}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="esewa">eSewa</option>
                <option value="khalti">Khalti</option>
                <option value="bank">Bank</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`account-${membershipId}`}>Cashbook account</Label>
              <Select
                id={`account-${membershipId}`}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setPayOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={onConfirmPay}>
              {pending ? "Saving…" : "Confirm full payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
