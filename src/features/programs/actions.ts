"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";
import type { ActionResult } from "@/lib/actions/types";

export const assignProgramSchema = z.object({
  customerId: z.string(),
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function assignProgramAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = assignProgramSchema.parse(raw);
    
    const program = await prisma.customProgram.create({
      data: {
        businessId,
        customerId: input.customerId,
        name: input.name,
        content: input.content, // Using string for simple MVP rich text
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });

    revalidatePath("/app/memberships/programs");
    return { ok: true, data: { id: program.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export const logMetricSchema = z.object({
  customerId: z.string(),
  metricName: z.string().min(1, "Metric name is required"),
  value: z.number(),
  unit: z.string().min(1, "Unit is required"),
});

export async function logProgressMetricAction(
  raw: unknown
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // Portal action, skipping session check for MVP
    const input = logMetricSchema.parse(raw);
    
    await prisma.progressMetric.create({
      data: {
        customerId: input.customerId,
        metricName: input.metricName,
        value: input.value,
        unit: input.unit,
      },
    });

    revalidatePath(`/portal/[slug]/programs`); // We'll trigger generic revalidate or router.refresh
    return { ok: true, data: { success: true } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
