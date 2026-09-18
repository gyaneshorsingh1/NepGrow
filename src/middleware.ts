import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pathSurfaceHint, resolveHostContext } from "@/lib/tenancy/host";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "localhost";

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let context = resolveHostContext(hostname);
  const pathHint = pathSurfaceHint(pathname);

  // Localhost path-based routing when custom hosts are not configured
  if (
    (hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1")) &&
    pathHint
  ) {
    context = pathHint;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nepgrow-surface", context.type);
  if (context.type === "category") {
    requestHeaders.set("x-nepgrow-category", context.domainSlug);
  }

  // Host-based rewrite for production-like local hosts
  if (!hostname.startsWith("localhost") && !hostname.startsWith("127.0.0.1")) {
    if (context.type === "admin" && !pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    if (context.type === "app" && !pathname.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = `/app${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    if (context.type === "category" && !pathname.startsWith("/sites/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/sites/${context.domainSlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
