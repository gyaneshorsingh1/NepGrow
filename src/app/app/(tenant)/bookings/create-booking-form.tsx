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
import { createBookingSchema } from "@/lib/validation/schemas";

const formSchema = createBookingSchema
  .omit({ startAt: true, endAt: true })
  .extend({
    startAtLocal: z.string().min(1),
    endAtLocal: z.string().min(1),
    totalCents: z.coerce.number().min(0).default(0),
  });

type Values = z.output<typeof formSchema>;

function toIso(local: string) {
  return new Date(local).toISOString();
}

export function CreateBookingForm({
  courts,
  customers,
}: {
  courts: Array<{ id: string; name: string; facilityName: string }>;
  customers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(formSchema) as Resolver<Values>,
    defaultValues: {
      courtId: courts[0]?.id ?? "",
      customerId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      startAtLocal: "",
      endAtLocal: "",
      notes: "",
      totalCents: 0,
      status: "CONFIRMED",
    },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createBookingAction({
      courtId: values.courtId,
      customerId: values.customerId || undefined,
      customerName: values.customerName || undefined,
      customerEmail: values.customerEmail || undefined,
      customerPhone: values.customerPhone,
      startAt: toIso(values.startAtLocal),
      endAt: toIso(values.endAtLocal),
      notes: values.notes,
      totalCents: values.totalCents,
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
        <Label htmlFor="courtId">Court</Label>
        <Select id="courtId" {...form.register("courtId")}>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.facilityName} · {c.name}
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
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...form.register("status")}>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
        </Select>
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/bookings">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || courts.length === 0}>
          {pending ? "Saving…" : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
