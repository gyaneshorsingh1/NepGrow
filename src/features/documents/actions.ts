"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

import type { ActionResult } from "@/lib/actions/types";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Document content is required"),
  isRequired: z.boolean().default(false),
});

export async function createDocumentTemplateAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = createTemplateSchema.parse(raw);
    
    const template = await prisma.documentTemplate.create({
      data: {
        businessId,
        name: input.name,
        content: input.content,
        isRequired: input.isRequired,
      },
    });

    // If it's a required template, optionally assign it to all active customers as PENDING.
    // For MVP, we will only check required templates dynamically at login.

    revalidatePath("/app/settings/documents");
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export const signDocumentSchema = z.object({
  templateId: z.string(),
  customerId: z.string(),
  signatureName: z.string().min(1, "Signature is required"),
});

export async function signCustomerDocumentAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // This is called from the Portal, so we don't check staff session here,
    // but we should verify the portal session in a real implementation.
    const input = signDocumentSchema.parse(raw);
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    await prisma.customerDocument.create({
      data: {
        businessId,
        customerId: input.customerId,
        templateId: input.templateId,
        status: "SIGNED",
        signatureData: input.signatureName,
        signedAt: new Date(),
        ipAddress: ip,
      },
    });

    revalidatePath(`/portal/${businessId}/dashboard`);
    return { ok: true, data: { success: true } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
