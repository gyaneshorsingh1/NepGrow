"use server";

import { revalidatePath } from "next/cache";

import { resolveTenantContext } from "@/lib/authorization/context";
import { toErrorMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/actions/types";
import {
  assignMembershipSchema,
  cancelMembershipSchema,
  completeMembershipPaymentSchema,
  createMembershipProductSchema,
  deleteMembershipProductSchema,
  refundPaymentSchema,
  setMembershipProductStatusSchema,
  updateMembershipProductSchema,
} from "@/lib/validation/schemas";
import {
  assignMembership,
  cancelMembership,
  completeMembershipPayment,
  createMembershipProduct,
  deleteMembershipProduct,
  setMembershipProductStatus,
  updateMembershipProduct,
} from "@/server/services/memberships";
import { refundPayment } from "@/server/services/sports";

function revalidateMemberships() {
  revalidatePath("/app/memberships");
  revalidatePath("/app/membership-plans");
  revalidatePath("/app/payments");
}

export async function createMembershipProductAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = createMembershipProductSchema.parse(raw);
    const product = await createMembershipProduct(ctx, input);
    revalidateMemberships();
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateMembershipProductAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = updateMembershipProductSchema.parse(raw);
    const product = await updateMembershipProduct(ctx, input);
    revalidateMemberships();
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setMembershipProductStatusAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = setMembershipProductStatusSchema.parse(raw);
    const product = await setMembershipProductStatus(
      ctx,
      input.id,
      input.status,
    );
    revalidateMemberships();
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteMembershipProductAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; deactivated: boolean }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = deleteMembershipProductSchema.parse(raw);
    const result = await deleteMembershipProduct(ctx, input.id);
    revalidateMemberships();
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function assignMembershipAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = assignMembershipSchema.parse(raw);
    const membership = await assignMembership(ctx, input);
    revalidateMemberships();
    return { ok: true, data: { id: membership.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function cancelMembershipAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = cancelMembershipSchema.parse(raw);
    const membership = await cancelMembership(ctx, input.membershipId);
    revalidateMemberships();
    return { ok: true, data: { id: membership.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function completeMembershipPaymentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = completeMembershipPaymentSchema.parse(raw);
    const payment = await completeMembershipPayment(ctx, input);
    revalidateMemberships();
    return { ok: true, data: { id: payment.id, status: payment.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function refundMembershipPaymentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const ctx = await resolveTenantContext();
    const input = refundPaymentSchema.parse(raw);
    const payment = await refundPayment(ctx, input.paymentId);
    revalidateMemberships();
    return { ok: true, data: { id: payment.id, status: payment.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
