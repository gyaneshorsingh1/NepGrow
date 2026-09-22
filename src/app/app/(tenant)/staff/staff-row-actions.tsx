"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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
import { updateStaffAction } from "@/features/sports/actions";

type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: string;
};

export function StaffRowActions({
  staff,
  canUpdate,
}: {
  staff: StaffRow;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(staff.name);
  const [email, setEmail] = React.useState(staff.email ?? "");
  const [phone, setPhone] = React.useState(staff.phone ?? "");
  const [title, setTitle] = React.useState(staff.title ?? "");
  const [status, setStatus] = React.useState(staff.status);

  React.useEffect(() => {
    if (!open) return;
    setName(staff.name);
    setEmail(staff.email ?? "");
    setPhone(staff.phone ?? "");
    setTitle(staff.title ?? "");
    setStatus(staff.status);
  }, [open, staff]);

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateStaffAction({
        id: staff.id,
        name,
        email,
        phone,
        title,
        status,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Staff updated");
      setOpen(false);
      router.refresh();
    });
  }

  if (!canUpdate) return null;

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
                <DialogTitle>Edit staff profile</DialogTitle>
                <DialogDescription>Update staff details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`staff-name-${staff.id}`}>Name</Label>
                  <Input
                    id={`staff-name-${staff.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff-email-${staff.id}`}>Email</Label>
                  <Input
                    id={`staff-email-${staff.id}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff-phone-${staff.id}`}>Phone</Label>
                  <Input
                    id={`staff-phone-${staff.id}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff-title-${staff.id}`}>Title</Label>
                  <Input
                    id={`staff-title-${staff.id}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff-status-${staff.id}`}>Status</Label>
                  <Select
                    id={`staff-status-${staff.id}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
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
    </div>
  );
}
