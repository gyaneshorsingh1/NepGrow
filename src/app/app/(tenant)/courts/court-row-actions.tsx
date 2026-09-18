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
import {
  deleteCourtAction,
  updateCourtAction,
} from "@/features/sports/actions";

type CourtRow = {
  id: string;
  facilityId: string;
  name: string;
  capacity: number | null;
  hourlyRateCents: number;
  status: string;
};

export function CourtRowActions({
  court,
  facilities,
  canUpdate,
  canDelete,
  currencyDecimals = 2,
}: {
  court: CourtRow;
  facilities: Array<{ id: string; name: string }>;
  canUpdate: boolean;
  canDelete: boolean;
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [facilityId, setFacilityId] = React.useState(court.facilityId);
  const [name, setName] = React.useState(court.name);
  const [capacity, setCapacity] = React.useState(
    court.capacity?.toString() ?? "",
  );
  const [hourlyRate, setHourlyRate] = React.useState(
    String(court.hourlyRateCents),
  );
  const [status, setStatus] = React.useState(court.status);

  React.useEffect(() => {
    if (!open) return;
    setFacilityId(court.facilityId);
    setName(court.name);
    setCapacity(court.capacity?.toString() ?? "");
    setHourlyRate(String(court.hourlyRateCents));
    setStatus(court.status);
  }, [open, court]);

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateCourtAction({
        id: court.id,
        facilityId,
        name,
        capacity: capacity ? Number(capacity) : undefined,
        hourlyRateCents: Number(hourlyRate),
        status,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Court updated");
      setOpen(false);
      router.refresh();
    });
  }

  function onDisable() {
    if (!window.confirm(`Disable court “${court.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteCourtAction({ id: court.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Court disabled");
      router.refresh();
    });
  }

  if (!canUpdate && !canDelete) return null;

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

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
                <DialogTitle>Edit court</DialogTitle>
                <DialogDescription>Update court details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`court-facility-${court.id}`}>Facility</Label>
                  <Select
                    id={`court-facility-${court.id}`}
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`court-name-${court.id}`}>Name</Label>
                  <Input
                    id={`court-name-${court.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`court-capacity-${court.id}`}>Capacity</Label>
                  <Input
                    id={`court-capacity-${court.id}`}
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`court-rate-${court.id}`}>Hourly rate</Label>
                  <Input
                    id={`court-rate-${court.id}`}
                    type="number"
                    step={step}
                    min={0}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`court-status-${court.id}`}>Status</Label>
                  <Select
                    id={`court-status-${court.id}`}
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
      <PermissionGuard can={canDelete && court.status === "ACTIVE"}>
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
