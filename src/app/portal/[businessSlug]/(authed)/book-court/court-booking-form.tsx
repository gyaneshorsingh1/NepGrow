"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPortalCourtBookingAction } from "@/features/portal/booking-actions";
import { formatMoney } from "@/lib/utils";

type CourtOption = {
  id: string;
  name: string;
  facilityName: string;
  hourlyRateCents: number;
};

export function PortalCourtBookingForm({
  businessSlug,
  courts,
  currency,
}: {
  businessSlug: string;
  courts: CourtOption[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [courtId, setCourtId] = React.useState(courts[0]?.id ?? "");
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const court = courts.find((c) => c.id === courtId);
  const hours =
    startAt && endAt
      ? Math.max(
          0,
          (new Date(endAt).getTime() - new Date(startAt).getTime()) /
            (1000 * 60 * 60),
        )
      : 0;
  const total =
    hours > 0
      ? Math.round((court?.hourlyRateCents ?? 0) * hours * 100) / 100
      : (court?.hourlyRateCents ?? 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await createPortalCourtBookingAction({
      businessSlug,
      courtId,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      notes,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Court booked");
    router.push(`/portal/${businessSlug}/bookings`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="courtId">Court</Label>
        <Select
          id="courtId"
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          required
        >
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.facilityName} · {c.name} (
              {formatMoney(c.hourlyRateCents, currency)}/hr)
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startAt">Start</Label>
          <Input
            id="startAt"
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt">End</Label>
          <Input
            id="endAt"
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="h-11"
          />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">Charge</p>
        <p className="mt-1 text-muted-foreground">
          Court rate {formatMoney(court?.hourlyRateCents ?? 0, currency)}/hr
          {hours > 0 ? ` · ${hours.toFixed(2)} hr` : ""}
        </p>
        <p className="mt-1 text-base font-semibold tabular-nums">
          Total {formatMoney(total, currency)}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending || !courtId}>
        {pending ? "Booking…" : "Confirm court booking"}
      </Button>
    </form>
  );
}
