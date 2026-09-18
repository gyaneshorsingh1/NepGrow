"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  deleteCashbookAccountAction,
  updateCashbookAccountAction,
} from "@/features/accounting/actions";

type AccountRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  openingBalanceCents: number;
  notes: string | null;
  _count: { transactions: number };
};

export function AccountRowActions({
  account,
  canView,
  canUpdate,
  canDelete,
  currencyDecimals = 2,
}: {
  account: AccountRow;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(account.name);
  const [openingBalance, setOpeningBalance] = React.useState(
    String(account.openingBalanceCents),
  );
  const [notes, setNotes] = React.useState(account.notes ?? "");
  const [status, setStatus] = React.useState(account.status);

  React.useEffect(() => {
    if (!open) return;
    setName(account.name);
    setOpeningBalance(String(account.openingBalanceCents));
    setNotes(account.notes ?? "");
    setStatus(account.status);
  }, [open, account]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canUpdate) return;
    setPending(true);
    const result = await updateCashbookAccountAction({
      accountId: account.id,
      name,
      openingBalanceCents: Number(openingBalance),
      notes: notes || undefined,
      status,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Account updated");
    setOpen(false);
    router.refresh();
  }

  async function onDelete() {
    if (!canDelete) return;
    if (!window.confirm(`Delete account “${account.name}”?`)) return;
    setPending(true);
    const result = await deleteCashbookAccountAction({ accountId: account.id });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Account deleted");
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  return (
    <div className="flex justify-end gap-1">
      <PermissionGuard can={canView}>
        <Button asChild type="button" variant="ghost" size="icon" title="View">
          <Link href={`/app/accounting/cashbook/${account.id}`}>
            <Eye aria-hidden />
            <span className="sr-only">View</span>
          </Link>
        </Button>
      </PermissionGuard>
      <PermissionGuard can={canUpdate}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              title="Edit"
            >
              <Pencil aria-hidden />
              <span className="sr-only">Edit</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onSave} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit account</DialogTitle>
                <DialogDescription>Update cashbook account details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`account-name-${account.id}`}>Account name</Label>
                  <Input
                    id={`account-name-${account.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`account-balance-${account.id}`}>
                    Opening balance
                  </Label>
                  <Input
                    id={`account-balance-${account.id}`}
                    type="number"
                    step={step}
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`account-notes-${account.id}`}>Notes</Label>
                  <Input
                    id={`account-notes-${account.id}`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`account-status-${account.id}`}>Status</Label>
                  <Select
                    id={`account-status-${account.id}`}
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as AccountRow["status"])
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PermissionGuard>
      {canDelete && account._count.transactions === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete"
          aria-label={`Delete ${account.name}`}
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}