import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { AppError } from "@/lib/errors";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new AppError("Authentication required", "UNAUTHORIZED", 401);
  }
  return session;
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  const user = session.user as { isPlatformAdmin?: boolean };
  if (!user.isPlatformAdmin) {
    throw new AppError("Platform admin access required", "FORBIDDEN", 403);
  }
  return session;
}
