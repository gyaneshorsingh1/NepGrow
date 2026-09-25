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
  createPaymentSchema,
  createAvailabilityRuleSchema,
  updateBookingStatusSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  updateFacilitySchema,
  deleteFacilitySchema,
  updateCourtSchema,
  deleteCourtSchema,
  refundPaymentSchema,
  createStaffSchema,
  updateStaffSchema,
} from "@/lib/validation/schemas";
import {
  createBooking,
  createCourt,
  createCustomer,
  createFacility,
  createPayment,
  createStaff,
  updateStaff,
  createAvailabilityRule,
  updateBookingStatus,
  updateCustomer,
  deleteCustomer,
  updateFacility,
  deleteFacility,
  updateCourt,
  deleteCourt,
  refundPayment,
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
      password: input.password || undefined,
      status: input.status,
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
      status: input.status,
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
      courtId: input.courtId || undefined,
      staffProfileId: input.staffProfileId || undefined,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail || undefined,
      customerPhone: input.customerPhone,
      startAt: input.startAt,
      endAt: input.endAt,
      notes: input.notes,
      totalCents: input.totalCents,
      status: input.status,
    });
    revalidatePath("/app/bookings");
    revalidatePath("/app/bookings/trainers");
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
      membershipId: input.membershipId,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      cashbookAccountId: input.cashbookAccountId,
    });
    revalidatePath("/app/payments");
    return { ok: true, data: { id: payment.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createStaffAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createStaffSchema.parse(raw);
    const staff = await createStaff(ctx, {
      name: input.name,
      email: input.email,
      password: input.password,
      roleId: input.roleId,
      phone: input.phone || undefined,
      title: input.title || undefined,
      hourlyRateCents: input.hourlyRateCents,
      status: input.status,
    });
    revalidatePath("/app/staff");
    revalidatePath("/app/staff/profiles");
    return { ok: true, data: { id: staff.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateStaffAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateStaffSchema.parse(raw);
    const staff = await updateStaff(ctx, input.id, {
      name: input.name,
      email: input.email || undefined,
      phone: input.phone || undefined,
      title: input.title || undefined,
      hourlyRateCents: input.hourlyRateCents,
      status: input.status,
      password: input.password || undefined,
      roleId: input.roleId || undefined,
    });
    revalidatePath("/app/staff");
    revalidatePath("/app/staff/profiles");
    return { ok: true, data: { id: staff.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createAvailabilityRuleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createAvailabilityRuleSchema.parse(raw);
    const rule = await createAvailabilityRule(ctx, {
      courtId: input.courtId || undefined,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    revalidatePath("/app/availability");
    revalidatePath("/app/bookings");
    return { ok: true, data: { id: rule.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateBookingStatusAction(
  raw: unknown,
): Promise<ActionResult<{ status: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateBookingStatusSchema.parse(raw);
    const booking = await updateBookingStatus(
      ctx,
      input.bookingId,
      input.status,
    );
    revalidatePath("/app/bookings");
    return { ok: true, data: { status: booking.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCustomerAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateCustomerSchema.parse(raw);
    const customer = await updateCustomer(ctx, input.id, {
      name: input.name,
      email: input.email || undefined,
      phone: input.phone,
      notes: input.notes,
      password: input.password || undefined,
      status: input.status,
    });
    revalidatePath("/app/customers");
    return { ok: true, data: { id: customer.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCustomerAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteCustomerSchema.parse(raw);
    const customer = await deleteCustomer(ctx, input.id);
    revalidatePath("/app/customers");
    return { ok: true, data: { id: customer.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateFacilityAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateFacilitySchema.parse(raw);
    const facility = await updateFacility(ctx, input.id, {
      name: input.name,
      sport: input.sport,
      description: input.description,
      status: input.status,
    });
    revalidatePath("/app/facilities");
    revalidatePath("/app/courts");
    return { ok: true, data: { id: facility.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteFacilityAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteFacilitySchema.parse(raw);
    const facility = await deleteFacility(ctx, input.id);
    revalidatePath("/app/facilities");
    revalidatePath("/app/courts");
    return { ok: true, data: { id: facility.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCourtAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateCourtSchema.parse(raw);
    const court = await updateCourt(ctx, input.id, {
      facilityId: input.facilityId,
      name: input.name,
      capacity: input.capacity,
      hourlyRateCents: input.hourlyRateCents,
      status: input.status,
    });
    revalidatePath("/app/courts");
    revalidatePath("/app/facilities");
    return { ok: true, data: { id: court.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCourtAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteCourtSchema.parse(raw);
    const court = await deleteCourt(ctx, input.id);
    revalidatePath("/app/courts");
    revalidatePath("/app/facilities");
    return { ok: true, data: { id: court.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function refundPaymentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = refundPaymentSchema.parse(raw);
    const payment = await refundPayment(ctx, input.paymentId);
    revalidatePath("/app/payments");
    return { ok: true, data: { id: payment.id, status: payment.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
