"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/types";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";
import { checkInSchema } from "@/features/attendance/schemas";

export async function getTodayAttendance(businessId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  return prisma.checkIn.findMany({
    where: {
      businessId,
      checkInAt: { gte: start, lte: end },
    },
    include: {
      customer: { select: { id: true, name: true } },
      facility: { select: { id: true, name: true } },
    },
    orderBy: { checkInAt: "desc" },
  });
}

export async function createCheckInAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = checkInSchema.parse(raw);
    
    const checkIn = await prisma.checkIn.create({
      data: {
        businessId,
        customerId: input.customerId,
        facilityId: input.facilityId,
        notes: input.notes,
      },
    });

    revalidatePath("/app/attendance");
    return { ok: true, data: { id: checkIn.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function checkOutAction(
  checkInId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const checkIn = await prisma.checkIn.update({
      where: { id: checkInId },
      data: { checkOutAt: new Date() },
    });

    revalidatePath("/app/attendance");
    return { ok: true, data: { id: checkIn.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
