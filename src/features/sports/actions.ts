"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import {
  createBookingSchema,
  createCourtSchema,
  createCustomerSchema,
  createFacilitySchema,
  createMembershipProductSchema,
  createPaymentSchema,
} from "@/lib/validation/schemas";
import {
  createBooking,
  createCourt,
  createCustomer,
  createFacility,
  createMembershipProduct,
  createPayment,
  createStaff,
} from "@/server/services/sports";

export async function createCustomerAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createCustomerSchema.parse(raw);
    const customer = await createCustomer(ctx, {
      name: input.name,
      email: input.email || undefined,
      phone: input.phone,
      notes: input.notes,
    });
    revalidatePath("/app/customers");
    return { ok: true, data: { id: customer.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createFacilityAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createFacilitySchema.parse(raw);
    const facility = await createFacility(ctx, input);
    revalidatePath("/app/facilities");
    revalidatePath("/app/courts");
    return { ok: true, data: { id: facility.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createCourtAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createCourtSchema.parse(raw);
    const court = await createCourt(ctx, {
      facilityId: input.facilityId,
      name: input.name,
      capacity: input.capacity,
      hourlyRateCents: input.hourlyRateCents,
    });
    revalidatePath("/app/courts");
    revalidatePath("/app/facilities");
    return { ok: true, data: { id: court.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createBookingAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createBookingSchema.parse(raw);
    const booking = await createBooking(ctx, {
      courtId: input.courtId,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail || undefined,
      customerPhone: input.customerPhone,
      startAt: input.startAt,
      endAt: input.endAt,
      notes: input.notes,
      totalCents: input.totalCents,
    });
    revalidatePath("/app/bookings");
    return { ok: true, data: { id: booking.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createPaymentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createPaymentSchema.parse(raw);
    const payment = await createPayment(ctx, {
      amountCents: input.amountCents,
      customerId: input.customerId,
      bookingId: input.bookingId,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
    });
    revalidatePath("/app/payments");
    return { ok: true, data: { id: payment.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createMembershipProductAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createMembershipProductSchema.parse(raw);
    const product = await createMembershipProduct(ctx, {
      name: input.name,
      description: input.description,
      priceCents: input.priceCents,
      durationDays: input.durationDays,
    });
    revalidatePath("/app/memberships");
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createStaffAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const name = String((raw as { name?: string }).name ?? "").trim();
    if (name.length < 2) return { ok: false, error: "Name is required" };
    const staff = await createStaff(ctx, {
      name,
      email: (raw as { email?: string }).email || undefined,
      phone: (raw as { phone?: string }).phone || undefined,
      title: (raw as { title?: string }).title || undefined,
    });
    revalidatePath("/app/staff");
    return { ok: true, data: { id: staff.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
