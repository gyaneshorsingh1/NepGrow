import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type AppSessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isPlatformAdmin: boolean;
  status: string;
};

export type AppSession = {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    activeBusinessId?: string | null;
    [key: string]: unknown;
  };
  user: AppSessionUser;
};

export type LoginSurface = "admin" | "app";

/**
 * Request-scoped session (React cache). Layout + page + actions in the same
 * render share one Better Auth + DB lookup instead of repeating it.
 */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const raw = await auth.api.getSession({
    headers: await headers(),
  });

  if (!raw?.user?.id) return null;

  // Prefer fields already on the session user; only hit DB for platform flags
  // when missing (avoids a full user row fetch on every navigation when present).
  const sessionUser = raw.user as {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    isPlatformAdmin?: boolean;
    status?: string;
  };

  let isPlatformAdmin = Boolean(sessionUser.isPlatformAdmin);
  let status = sessionUser.status ?? "ACTIVE";

  if (sessionUser.isPlatformAdmin === undefined || sessionUser.status === undefined) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { isPlatformAdmin: true, status: true },
    });
    if (!dbUser || dbUser.status === "DISABLED") return null;
    isPlatformAdmin = dbUser.isPlatformAdmin;
    status = dbUser.status;
  } else if (status === "DISABLED") {
    return null;
  }

  return {
    session: raw.session as AppSession["session"],
    user: {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      emailVerified: sessionUser.emailVerified,
      image: sessionUser.image,
      createdAt: sessionUser.createdAt,
      updatedAt: sessionUser.updatedAt,
      isPlatformAdmin,
      status,
    },
  };
});

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new AppError("Authentication required", "UNAUTHORIZED", 401);
  }
  return session;
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) {
    throw new AppError("Platform admin access required", "FORBIDDEN", 403);
  }
  return session;
}

export async function userHasActiveTenantMembership(userId: string) {
  const membership = await prisma.businessMembership.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { businessId: true },
  });
  return Boolean(membership);
}

/**
 * Post-login destination per NepGrow surface rules:
 * - Platform Super Admin → /admin (admin.nepgrow.com)
 * - Business tenant user (membership) → /app (app.nepgrow.com)
 * - Wrong surface login still routes to the correct panel
 */
export async function getPostLoginPath(preferred?: string): Promise<string> {
  const session = await getSession();
  const wantsAdmin =
    preferred?.startsWith("/admin") || preferred === "admin";

  if (!session) {
    return wantsAdmin ? "/admin/login" : "/app/login";
  }

  if (session.user.isPlatformAdmin) {
    return "/admin";
  }

  const hasTenant = await userHasActiveTenantMembership(session.user.id);
  if (hasTenant) {
    return "/app";
  }

  return wantsAdmin ? "/admin/login" : "/app/login";
}

export function preferredSurfaceFromPath(path?: string): LoginSurface {
  if (path?.startsWith("/admin")) return "admin";
  return "app";
}
