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
  deleteFacilityAction,
  updateFacilityAction,
} from "@/features/sports/actions";

type FacilityRow = {
  id: string;
  name: string;
  sport: string;
  description: string | null;
  status: string;
};

export function FacilityRowActions({
  facility,
  canUpdate,
  canDelete,
}: {
  facility: FacilityRow;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(facility.name);
  const [sport, setSport] = React.useState(facility.sport);
  const [description, setDescription] = React.useState(
    facility.description ?? "",
  );
  const [status, setStatus] = React.useState(facility.status);

  React.useEffect(() => {
    if (!open) return;
    setName(facility.name);
    setSport(facility.sport);
    setDescription(facility.description ?? "");
    setStatus(facility.status);
  }, [open, facility]);

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateFacilityAction({
        id: facility.id,
        name,
        sport,
        description,
        status,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Facility updated");
      setOpen(false);
      router.refresh();
    });
  }

  function onDisable() {
    if (!window.confirm(`Disable facility “${facility.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteFacilityAction({ id: facility.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Facility disabled");
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
                <DialogTitle>Edit facility</DialogTitle>
                <DialogDescription>Update facility details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`facility-name-${facility.id}`}>Name</Label>
                  <Input
                    id={`facility-name-${facility.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`facility-sport-${facility.id}`}>Sport</Label>
                  <Input
                    id={`facility-sport-${facility.id}`}
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`facility-status-${facility.id}`}>Status</Label>
                  <Select
                    id={`facility-status-${facility.id}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`facility-description-${facility.id}`}>
                    Description
                  </Label>
                  <Textarea
                    id={`facility-description-${facility.id}`}
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
      <PermissionGuard can={canDelete && facility.status === "ACTIVE"}>
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
