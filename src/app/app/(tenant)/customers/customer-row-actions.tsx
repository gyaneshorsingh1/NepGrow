"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCustomerAction,
  updateCustomerAction,
} from "@/features/sports/actions";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
};

export function CustomerRowActions({
  customer,
  canUpdate,
  canDelete,
}: {
  customer: CustomerRow;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(customer.name);
  const [email, setEmail] = React.useState(customer.email ?? "");
  const [phone, setPhone] = React.useState(customer.phone ?? "");
  const [notes, setNotes] = React.useState(customer.notes ?? "");
  const [status, setStatus] = React.useState(customer.status);
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(customer.name);
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setNotes(customer.notes ?? "");
    setStatus(customer.status);
    setPassword("");
  }, [open, customer]);

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateCustomerAction({
        id: customer.id,
        name,
        email,
        phone,
        notes,
        status,
        password: password || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Customer updated");
      setOpen(false);
      router.refresh();
    });
  }

  function onDisable() {
    if (!window.confirm(`Disable customer “${customer.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteCustomerAction({ id: customer.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Customer disabled");
      router.refresh();
    });
  }

  if (!canUpdate && !canDelete) return null;

  return (
    <div className="flex justify-end gap-1">
      <PermissionGuard can={canUpdate}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Edit"
              disabled={pending}
            >
              <Pencil aria-hidden />
              <span className="sr-only">Edit</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onSave} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit customer</DialogTitle>
                <DialogDescription>Update contact details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`customer-name-${customer.id}`}>Name</Label>
                  <Input
                    id={`customer-name-${customer.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`customer-email-${customer.id}`}>Email</Label>
                  <Input
                    id={`customer-email-${customer.id}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`customer-password-${customer.id}`}>
                    Portal password
                  </Label>
                  <Input
                    id={`customer-password-${customer.id}`}
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`customer-phone-${customer.id}`}>Phone</Label>
                  <Input
                    id={`customer-phone-${customer.id}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`customer-status-${customer.id}`}>Status</Label>
                  <Select
                    id={`customer-status-${customer.id}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`customer-notes-${customer.id}`}>Notes</Label>
                  <Textarea
                    id={`customer-notes-${customer.id}`}
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
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
      <PermissionGuard can={canDelete && customer.status === "ACTIVE"}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Disable"
          className="text-destructive hover:text-destructive"
          disabled={pending}
          onClick={onDisable}
        >
          <Trash2 aria-hidden />
          <span className="sr-only">Disable</span>
        </Button>
      </PermissionGuard>
    </div>
  );
}
