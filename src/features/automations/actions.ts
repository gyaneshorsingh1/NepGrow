"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";
import type { ActionResult } from "@/lib/actions/types";

export const createAutomationRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  triggerEvent: z.enum(["MEMBERSHIP_EXPIRING", "MEMBERSHIP_EXPIRED", "NEW_LEAD"]),
  offsetDays: z.number().int(),
  templateId: z.string().min(1, "Template is required"),
  isActive: z.boolean().default(true),
});

export async function createAutomationRuleAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = createAutomationRuleSchema.parse(raw);
    
    const rule = await prisma.automationRule.create({
      data: {
        businessId,
        name: input.name,
        triggerEvent: input.triggerEvent,
        offsetDays: input.offsetDays,
        templateId: input.templateId,
        isActive: input.isActive,
      },
    });

    revalidatePath("/app/communications/automations");
    return { ok: true, data: { id: rule.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function toggleAutomationRuleAction(
  ruleId: string,
  isActive: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    await prisma.automationRule.update({
      where: { id: ruleId },
      data: { isActive },
    });

    revalidatePath("/app/communications/automations");
    return { ok: true, data: { id: ruleId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
