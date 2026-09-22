import { describe, expect, it } from "vitest";

import { isOwnerRole, OWNER_ROLE_KEY } from "@/lib/authorization/guards";
import { defineAbilityFor } from "@/lib/authorization/ability";

describe("isOwnerRole", () => {
  it("matches system owner key", () => {
    expect(isOwnerRole({ key: OWNER_ROLE_KEY, isSystem: true })).toBe(true);
    expect(isOwnerRole({ key: OWNER_ROLE_KEY, isSystem: false })).toBe(false);
    expect(isOwnerRole({ key: "receptionist", isSystem: true })).toBe(false);
  });
});

describe("self-elevation prevention (ability subset)", () => {
  it("actor without customers.delete cannot grant that ability via CASL", () => {
    const actor = defineAbilityFor({
      permissionKeys: ["customers.view", "customers.create", "roles.update"],
      enabledModuleKeys: ["customers"],
    });
    expect(actor.can("delete", "customers")).toBe(false);
    expect(actor.can("update", "roles")).toBe(true);
  });

  it("receptionist cannot access role management", () => {
    const ability = defineAbilityFor({
      permissionKeys: [
        "dashboard.view",
        "customers.view",
        "customers.create",
        "bookings.view",
        "bookings.create",
      ],
      enabledModuleKeys: ["dashboard", "customers", "bookings"],
    });
    expect(ability.can("view", "roles")).toBe(false);
    expect(ability.can("create", "roles")).toBe(false);
    expect(ability.can("delete", "customers")).toBe(false);
  });

  it("platform admin is separate from tenant ability surface", () => {
    const tenant = defineAbilityFor({
      isPlatformAdmin: false,
      permissionKeys: ["roles.view", "users.view"],
      enabledModuleKeys: [],
    });
    expect(tenant.can("manage", "all")).toBe(false);
    expect(tenant.can("view", "clients")).toBe(false);

    const admin = defineAbilityFor({
      isPlatformAdmin: true,
      permissionKeys: [],
      enabledModuleKeys: [],
    });
    expect(admin.can("manage", "all")).toBe(true);
  });
});
