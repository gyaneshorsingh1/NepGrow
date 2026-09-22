"use server";

import { getPostLoginPath, getSession } from "@/lib/auth/session";
import { logActivity } from "@/server/services/activity";

export async function resolvePostLoginPathAction(
  preferred?: "/admin" | "/app" | string,
) {
  const path = await getPostLoginPath(preferred);
  const session = await getSession();
  if (session && !path.endsWith("/login")) {
    await logActivity({
      userId: session.user.id,
      businessId: session.user.isPlatformAdmin
        ? null
        : ((session.session.activeBusinessId as string | null) ?? null),
      action: "user.login",
      module: "auth",
      entity: "User",
      entityId: session.user.id,
      metadata: {
        surface: preferred?.startsWith("/admin") ? "admin" : "app",
        destination: path,
      },
    });
  }
  return path;
}

export async function getSessionUserAction() {
  const session = await getSession();
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isPlatformAdmin: session.user.isPlatformAdmin,
  };
}
