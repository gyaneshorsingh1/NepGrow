export function getRootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost";
}

export type HostContext =
  | { type: "marketing" }
  | { type: "admin" }
  | { type: "app" }
  | { type: "category"; domainSlug: string };

export function resolveHostContext(hostname: string): HostContext {
  const host = hostname.split(":")[0].toLowerCase();
  const rootDomain = getRootDomain();

  if (host === "localhost" || host === "127.0.0.1") {
    return { type: "marketing" };
  }

  if (host === rootDomain || host === `www.${rootDomain}`) {
    return { type: "marketing" };
  }

  if (host === `admin.${rootDomain}`) {
    return { type: "admin" };
  }

  if (host === `app.${rootDomain}`) {
    return { type: "app" };
  }

  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, -(rootDomain.length + 1));
    if (subdomain && !subdomain.includes(".")) {
      return { type: "category", domainSlug: subdomain };
    }
  }

  return { type: "marketing" };
}

/** Path-based fallback for local development without custom hosts */
export function pathSurfaceHint(pathname: string): HostContext | null {
  if (pathname.startsWith("/admin")) return { type: "admin" };
  if (pathname.startsWith("/app")) return { type: "app" };
  if (pathname.startsWith("/sites/")) {
    const parts = pathname.split("/");
    const domainSlug = parts[2];
    if (domainSlug) return { type: "category", domainSlug };
  }
  return null;
}
