"use server";

import { getPortalAccessFlags, getPortalSession } from "@/features/portal/actions";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";

export async function createPortalCourtBookingAction(input: {
  businessSlug: string;
  courtId: string;
  startAt: string;
  endAt: string;
  notes?: string;
}) {
  try {
    const session = await getPortalSession();
    if (!session || session.business.slug !== input.businessSlug) {
      return { ok: false as const, error: "Please sign in again" };
    }

    const flags = await getPortalAccessFlags(
      session.customer.id,
      session.business.id,
    );
    if (!flags.canBookCourt) {
      return {
        ok: false as const,
        error: "Court booking requires an active membership",
      };
    }

    const court = await prisma.court.findFirst({
      where: {
        id: input.courtId,
        businessId: session.business.id,
        status: "ACTIVE",
      },
    });
    if (!court) return { ok: false as const, error: "Court not found" };

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    if (!(startAt < endAt)) {
      return { ok: false as const, error: "End time must be after start time" };
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        courtId: court.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
      },
    });
    if (conflict) {
      return { ok: false as const, error: "Court is already booked for this time" };
    }

    const hours = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
    const totalCents = court.hourlyRateCents * hours;

    await prisma.booking.create({
      data: {
        businessId: session.business.id,
        customerId: session.customer.id,
        courtId: court.id,
        startAt,
        endAt,
        status: "CONFIRMED",
        notes: input.notes?.trim() || "Self-booked court via Portal",
        totalCents,
      },
    });

    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toErrorMessage(error) };
  }
}
