import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit } from "@/lib/security/rate-limit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const path = request.nextUrl.pathname;
  const isSensitive =
    path.includes("sign-in") ||
    path.includes("sign-up") ||
    path.includes("forget-password") ||
    path.includes("reset-password");

  if (isSensitive) {
    const limited = rateLimit({
      key: `auth:${ip}:${path}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!limited.ok) {
      return Response.json(
        { error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }
  }

  return handler.POST(request);
}
