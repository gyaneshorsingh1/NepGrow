"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/types";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
});

export async function createTemplateAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = createTemplateSchema.parse(raw);
    
    const template = await prisma.notificationTemplate.create({
      data: {
        businessId,
        name: input.name,
        subject: input.subject,
        body: input.body,
        type: "EMAIL",
      },
    });

    revalidatePath("/app/communications/templates");
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
