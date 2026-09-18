"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toErrorMessage } from "@/lib/errors";
import { createPublicBooking } from "@/server/services/sports";
import type { ActionResult } from "@/lib/actions/types";

const publicBookingSchema = z.object({
  businessId: z.string().min(1),
  courtId: z.string().min(1),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  notes: z.string().optional(),
  categorySlug: z.string().min(1),
  businessSlug: z.string().min(1),
});

export async function createPublicBookingAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const input = publicBookingSchema.parse(raw);
    const startAt = new Date(input.startAt).toISOString();
    const endAt = new Date(input.endAt).toISOString();

    const booking = await createPublicBooking({
      businessId: input.businessId,
      courtId: input.courtId,
      customerName: input.customerName,
      customerEmail: input.customerEmail || undefined,
      customerPhone: input.customerPhone,
      startAt,
      endAt,
      notes: input.notes,
    });

    revalidatePath(
      `/sites/${input.categorySlug}/${input.businessSlug}/book`,
    );

    return { ok: true, data: { id: booking.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
