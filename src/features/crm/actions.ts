"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/types";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function createLeadAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = createLeadSchema.parse(raw);
    
    const lead = await prisma.lead.create({
      data: {
        businessId,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone,
        source: input.source,
        notes: input.notes,
        status: "NEW",
      },
    });

    revalidatePath("/app/crm");
    return { ok: true, data: { id: lead.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export const updateLeadStatusSchema = z.object({
  leadId: z.string(),
  status: z.enum(["NEW", "CONTACTED", "TRIAL", "CONVERTED", "LOST"]),
});

export async function updateLeadStatusAction(
  raw: unknown
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = updateLeadStatusSchema.parse(raw);
    
    const lead = await prisma.lead.update({
      where: { id: input.leadId },
      data: { status: input.status },
    });

    revalidatePath("/app/crm");
    return { ok: true, data: { id: lead.id, status: lead.status } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
