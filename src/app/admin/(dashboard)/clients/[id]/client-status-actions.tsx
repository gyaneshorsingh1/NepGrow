"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateClientStatusAction } from "@/features/clients/actions";

export function ClientStatusActions({
  businessId,
  status,
}: {
  businessId: string;
  status: string;
}) {
  const router = useRouter();

  async function setStatus(next: "ACTIVE" | "SUSPENDED") {
    const result = await updateClientStatusAction({
      businessId,
      status: next,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(next === "SUSPENDED" ? "Client suspended" : "Client activated");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <Button type="button" onClick={() => setStatus("ACTIVE")}>
          Activate
        </Button>
      ) : null}
      {status !== "SUSPENDED" ? (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setStatus("SUSPENDED")}
        >
          Suspend
        </Button>
      ) : null}
    </div>
  );
}
