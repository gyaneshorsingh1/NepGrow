"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelMembershipAction } from "@/features/memberships/actions";

export function CancelMembershipButton({
  membershipId,
}: {
  membershipId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await cancelMembershipAction({ membershipId });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Membership cancelled");
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Cancel"}
    </Button>
  );
}
