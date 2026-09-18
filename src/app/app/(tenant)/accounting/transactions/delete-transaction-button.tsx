"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteAccountingTransactionAction } from "@/features/accounting/actions";

export function DeleteTransactionButton({
  transactionId,
  canDelete,
}: {
  transactionId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  if (!canDelete) return null;

  async function onDelete() {
    if (!window.confirm("Delete this transaction?")) return;
    setPending(true);
    const result = await deleteAccountingTransactionAction({ transactionId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaction deleted");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title="Delete"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={onDelete}
    >
      <Trash2 aria-hidden />
      <span className="sr-only">{pending ? "Deleting…" : "Delete"}</span>
    </Button>
  );
}
