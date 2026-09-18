"use server";

import { revalidatePath } from "next/cache";

import {
  authorize,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { toErrorMessage } from "@/lib/errors";
import { createRoleSchema } from "@/lib/validation/schemas";
import { logActivity } from "@/server/services/activity";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/types";

export async function createRoleAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await resolveTenantContext();
    await authorize(ctx, "create", "roles");

    const input = createRoleSchema.parse(raw);
    const key = input.key || slugify(input.name);

    const existing = await prisma.role.findFirst({
      where: { businessId: ctx.businessId, key },
    });
    if (existing) {
      return { ok: false, error: "A role with this key already exists" };
    }

    if (input.permissionIds.length) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: input.permissionIds } },
      });
      if (permissions.length !== input.permissionIds.length) {
        return { ok: false, error: "One or more permissions are invalid" };
      }
    }

    const role = await prisma.role.create({
      data: {
        businessId: ctx.businessId,
        name: input.name,
        key,
        description: input.description,
        isSystem: false,
        permissions: input.permissionIds.length
          ? {
              create: input.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });

    await logActivity({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "role.created",
      module: "roles",
      entity: "Role",
      entityId: role.id,
    });

    revalidatePath("/app/roles");
    return { ok: true, data: { id: role.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
