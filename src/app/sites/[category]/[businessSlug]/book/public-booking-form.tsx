"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPublicBookingAction } from "@/features/websites/public-booking-action";

type CourtOption = {
  id: string;
  label: string;
};

export function PublicBookingForm({
  businessId,
  categorySlug,
  businessSlug,
  courts,
}: {
  businessId: string;
  categorySlug: string;
  businessSlug: string;
  courts: CourtOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm({
    defaultValues: {
      courtId: courts[0]?.id ?? "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      startAt: "",
      endAt: "",
      notes: "",
    },
  });

  async function onSubmit(values: {
    courtId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startAt: string;
    endAt: string;
    notes: string;
  }) {
    setPending(true);
    const result = await createPublicBookingAction({
      businessId,
      categorySlug,
      businessSlug,
      courtId: values.courtId,
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      startAt: values.startAt,
      endAt: values.endAt,
      notes: values.notes,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Booking confirmed");
    form.reset({
      courtId: courts[0]?.id ?? "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      startAt: "",
      endAt: "",
      notes: "",
    });
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto grid max-w-xl gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="courtId" className="text-emerald-100">
          Court
        </Label>
        <Select id="courtId" className="bg-transparent text-white" {...form.register("courtId")}>
          {courts.map((c) => (
            <option key={c.id} value={c.id} className="text-black">
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerName" className="text-emerald-100">
          Your name
        </Label>
        <Input
          id="customerName"
          className="border-emerald-500/30 bg-transparent text-white"
          {...form.register("customerName", { required: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerEmail" className="text-emerald-100">
          Email
        </Label>
        <Input
          id="customerEmail"
          type="email"
          className="border-emerald-500/30 bg-transparent text-white"
          {...form.register("customerEmail")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerPhone" className="text-emerald-100">
          Phone
        </Label>
        <Input
          id="customerPhone"
          className="border-emerald-500/30 bg-transparent text-white"
          {...form.register("customerPhone")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startAt" className="text-emerald-100">
            Start
          </Label>
          <Input
            id="startAt"
            type="datetime-local"
            className="border-emerald-500/30 bg-transparent text-white"
            {...form.register("startAt", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt" className="text-emerald-100">
            End
          </Label>
          <Input
            id="endAt"
            type="datetime-local"
            className="border-emerald-500/30 bg-transparent text-white"
            {...form.register("endAt", { required: true })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-emerald-100">
          Notes
        </Label>
        <Textarea
          id="notes"
          rows={3}
          className="border-emerald-500/30 bg-transparent text-white"
          {...form.register("notes")}
        />
      </div>
      <Button
        type="submit"
        disabled={pending || courts.length === 0}
        className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
      >
        {pending ? "Booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}
