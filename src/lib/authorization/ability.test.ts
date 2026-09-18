import { describe, expect, it } from "vitest";
import {
  canAccessModule,
  defineAbilityFor,
  permissionKeyToRule,
} from "@/lib/authorization/ability";

describe("permissionKeyToRule", () => {
  it("parses module.action keys", () => {
    expect(permissionKeyToRule("customers.view")).toEqual({
      action: "view",
      subject: "customers",
    });
  });

  it("returns null for invalid keys", () => {
    expect(permissionKeyToRule("invalid")).toBeNull();
  });
});

describe("defineAbilityFor", () => {
  it("grants platform admin manage all", () => {
    const ability = defineAbilityFor({
      isPlatformAdmin: true,
      permissionKeys: [],
      enabledModuleKeys: [],
    });
    expect(ability.can("manage", "all")).toBe(true);
    expect(ability.can("delete", "payments")).toBe(true);
  });

  it("requires both module entitlement and permission", () => {
    const ability = defineAbilityFor({
      permissionKeys: ["payments.view", "reports.view"],
      enabledModuleKeys: ["payments"],
    });
    expect(ability.can("view", "payments")).toBe(true);
    expect(ability.can("view", "reports")).toBe(false);
  });

  it("denies when permission missing even if module enabled", () => {
    const ability = defineAbilityFor({
      permissionKeys: ["customers.view"],
      enabledModuleKeys: ["customers", "payments"],
    });
    expect(ability.can("view", "customers")).toBe(true);
    expect(ability.can("create", "customers")).toBe(false);
    expect(ability.can("view", "payments")).toBe(false);
  });
});

describe("canAccessModule", () => {
  it("intersects modules and view permission", () => {
    expect(
      canAccessModule(["bookings"], ["bookings.view"], "bookings"),
    ).toBe(true);
    expect(
      canAccessModule(["bookings"], ["customers.view"], "bookings"),
    ).toBe(false);
    expect(
      canAccessModule(["customers"], ["bookings.view"], "bookings"),
    ).toBe(false);
  });
});
