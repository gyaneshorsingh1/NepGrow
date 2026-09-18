import { prisma } from "@/lib/db";

export async function logActivity(input: {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  module?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await prisma.activityLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      entity: input.entity,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as object,
      ipAddress: input.ipAddress,
    },
  });
}
