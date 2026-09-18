import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma() {
  const existing = globalForPrisma.prisma;
  // After `prisma generate`, HMR can keep a stale client missing new delegates.
  if (
    existing &&
    typeof (existing as { membershipPermission?: unknown }).membershipPermission ===
      "undefined"
  ) {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }
  return globalForPrisma.prisma ?? createPrismaClient();
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
