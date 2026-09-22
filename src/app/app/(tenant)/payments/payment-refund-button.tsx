"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { refundPaymentAction } from "@/features/sports/actions";

export function PaymentRefundButton({
  paymentId,
  status,
  canRefund,
}: {
  paymentId: string;
  status: string;
  canRefund: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status !== "COMPLETED") return null;

  function onRefund() {
    startTransition(async () => {
      const result = await refundPaymentAction({ paymentId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment refunded");
      router.refresh();
    });
  }

  return (
    <PermissionGuard can={canRefund}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Refund"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={onRefund}
        >
          <Undo2 aria-hidden />
          <span className="sr-only">{pending ? "Refunding…" : "Refund"}</span>
        </Button>
      </div>
    </PermissionGuard>
  );
}
