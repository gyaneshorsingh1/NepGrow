"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAction } from "@/features/sports/actions";
import { formatMoney } from "@/lib/utils";

const formSchema = z
  .object({
    courtId: z.string().optional().or(z.literal("")),
    staffProfileId: z.string().optional().or(z.literal("")),
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal("")),
    customerPhone: z.string().optional(),
    startAtLocal: z.string().min(1),
    endAtLocal: z.string().min(1),
    notes: z.string().optional(),
    status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
  })
  .refine((v) => Boolean(v.courtId) || Boolean(v.staffProfileId), {
    message: "Select a court and/or a staff member",
    path: ["courtId"],
  });

type Values = z.output<typeof formSchema>;

function toIso(local: string) {
  return new Date(local).toISOString();
}

function durationHours(startLocal: string, endLocal: string) {
  if (!startLocal || !endLocal) return 0;
  const start = new Date(startLocal).getTime();
  const end = new Date(endLocal).getTime();
  if (!(end > start)) return 0;
  return (end - start) / (1000 * 60 * 60);
}

export function CreateBookingForm({
  courts,
  staff,
  customers,
  currency = "NPR",
}: {
  courts: Array<{
    id: string;
    name: string;
    facilityName: string;
    hourlyRateCents: number;
  }>;
  staff: Array<{
    id: string;
    name: string;
    title: string | null;
    hourlyRateCents: number;
  }>;
  customers: Array<{ id: string; name: string }>;
  currency?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(formSchema) as Resolver<Values>,
    defaultValues: {
      courtId: courts[0]?.id ?? "",
      staffProfileId: "",
      customerId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      startAtLocal: "",
      endAtLocal: "",
      notes: "",
      status: "CONFIRMED",
    },
  });

  const courtId = form.watch("courtId");
  const staffProfileId = form.watch("staffProfileId");
  const startAtLocal = form.watch("startAtLocal");
  const endAtLocal = form.watch("endAtLocal");

  const courtRate =
    courts.find((c) => c.id === courtId)?.hourlyRateCents ?? 0;
  const staffRate =
    staff.find((s) => s.id === staffProfileId)?.hourlyRateCents ?? 0;
  const hours = durationHours(startAtLocal, endAtLocal);
  const totalCents =
    hours > 0
      ? Math.round((courtRate + staffRate) * hours * 100) / 100
      : courtRate + staffRate;

  async function onSubmit(values: Values) {
    if (!values.courtId && !values.staffProfileId) {
      toast.error("Select a court and/or a staff member");
      return;
    }
    setPending(true);
    const result = await createBookingAction({
      courtId: values.courtId || undefined,
      staffProfileId: values.staffProfileId || undefined,
      customerId: values.customerId || undefined,
      customerName: values.customerName || undefined,
      customerEmail: values.customerEmail || undefined,
      customerPhone: values.customerPhone,
      startAt: toIso(values.startAtLocal),
      endAt: toIso(values.endAtLocal),
      notes: values.notes,
      totalCents,
      status: values.status,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Booking created");
    router.push("/app/bookings");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-3 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="courtId">Court (optional)</Label>
        <Select id="courtId" {...form.register("courtId")}>
          <option value="">No court</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.facilityName} · {c.name} ({c.hourlyRateCents}/hr)
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staffProfileId">Staff / trainer (optional)</Label>
        <Select id="staffProfileId" {...form.register("staffProfileId")}>
          <option value="">No staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.title ? ` · ${s.title}` : ""} ({s.hourlyRateCents}/hr)
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerId">Existing customer</Label>
        <Select id="customerId" {...form.register("customerId")}>
          <option value="">New / walk-in</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerName">Customer name</Label>
        <Input id="customerName" {...form.register("customerName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerPhone">Phone</Label>
        <Input id="customerPhone" {...form.register("customerPhone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startAtLocal">Start</Label>
        <Input
          id="startAtLocal"
          type="datetime-local"
          {...form.register("startAtLocal")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endAtLocal">End</Label>
        <Input
          id="endAtLocal"
          type="datetime-local"
          {...form.register("endAtLocal")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...form.register("status")}>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
        </Select>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 md:col-span-2">
        <p className="text-sm font-medium">Charge summary</p>
        <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex justify-between gap-2 sm:block">
            <dt>Court rate</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {formatMoney(courtRate, currency)}/hr
            </dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt>Staff rate</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {formatMoney(staffRate, currency)}/hr
            </dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt>Duration</dt>
            <dd className="font-medium text-foreground tabular-nums">
              {hours > 0 ? `${hours.toFixed(2)} hr` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt>Total</dt>
            <dd className="text-base font-semibold text-foreground tabular-nums">
              {formatMoney(totalCents, currency)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Total is calculated from rates × duration (not editable here). Set
          staff rates on Staff Profiles; court rates on Courts.
        </p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/bookings">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={pending || (courts.length === 0 && staff.length === 0)}
        >
          {pending ? "Saving…" : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
