"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateBookingStatusAction } from "@/features/sports/actions";

export function BookingStatusActions({
  bookingId,
  status,
  canCancel,
  canUpdate,
}: {
  bookingId: string;
  status: string;
  canCancel: boolean;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: "CANCELLED" | "COMPLETED" | "CONFIRMED") {
    startTransition(async () => {
      const result = await updateBookingStatusAction({
        bookingId,
        status: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Booking ${next.toLowerCase()}`);
      router.refresh();
    });
  }

  if (status === "CANCELLED" || status === "COMPLETED") return null;

  return (
    <div className="flex justify-end gap-1">
      {canUpdate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Complete"
          disabled={pending}
          onClick={() => setStatus("COMPLETED")}
        >
          <Check aria-hidden />
          <span className="hidden sm:inline">Complete</span>
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Cancel"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={() => setStatus("CANCELLED")}
        >
          <X aria-hidden />
          <span className="hidden sm:inline">Cancel</span>
        </Button>
      ) : null}
    </div>
  );
}
