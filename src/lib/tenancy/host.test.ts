import { describe, expect, it } from "vitest";
import { resolveHostContext, pathSurfaceHint } from "@/lib/tenancy/host";

describe("resolveHostContext", () => {
  it("detects admin and app hosts", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "nepgrow.local";
    expect(resolveHostContext("admin.nepgrow.local")).toEqual({ type: "admin" });
    expect(resolveHostContext("app.nepgrow.local")).toEqual({ type: "app" });
  });

  it("detects category subdomain", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "nepgrow.local";
    expect(resolveHostContext("sports.nepgrow.local")).toEqual({
      type: "category",
      domainSlug: "sports",
    });
  });

  it("treats localhost as marketing", () => {
    expect(resolveHostContext("localhost:3000")).toEqual({ type: "marketing" });
  });
});

describe("pathSurfaceHint", () => {
  it("maps path prefixes for local development", () => {
    expect(pathSurfaceHint("/admin/clients")).toEqual({ type: "admin" });
    expect(pathSurfaceHint("/app/bookings")).toEqual({ type: "app" });
    expect(pathSurfaceHint("/sites/sports/abc")).toEqual({
      type: "category",
      domainSlug: "sports",
    });
  });
});
