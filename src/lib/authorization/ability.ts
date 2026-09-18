import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";

export type Actions =
  | "manage"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "cancel"
  | "refund"
  | "disable"
  | "assign";

export type Subjects =
  | "all"
  | "dashboard"
  | "customers"
  | "bookings"
  | "facilities"
  | "courts"
  | "memberships"
  | "payments"
  | "accounting"
  | "staff"
  | "reports"
  | "settings"
  | "users"
  | "roles"
  | "permissions"
  | "clients"
  | "plans"
  | "modules"
  | "activity"
  | "websites";

export type AppAbility = MongoAbility<[Actions, Subjects]>;
export type AppRawRule = RawRuleOf<AppAbility>;

/** Modules always available for permission assignment / ability (not plan-gated). */
export const MODULE_EXEMPT_KEYS = [
  "all",
  "dashboard",
  "settings",
  "roles",
  "users",
  "permissions",
] as const;

export function isModuleExempt(moduleKey: string): boolean {
  return (MODULE_EXEMPT_KEYS as readonly string[]).includes(moduleKey);
}

/** Enabled plan modules plus always-available exempt keys. */
export function assignableModuleKeys(enabledModuleKeys: string[]): string[] {
  return [...new Set([...enabledModuleKeys, ...MODULE_EXEMPT_KEYS])];
}

/**
 * Whether an actor may grant a permission (enable it on a role / user).
 * Allowed when they have manage.all, hold the exact key, or have any access
 * to that module — so they can turn Off permissions back On.
 */
export function actorCanGrantPermission(
  actor: { permissionKeys: string[]; isPlatformAdmin?: boolean },
  permission: { key: string; moduleKey: string },
): boolean {
  if (actor.isPlatformAdmin || actor.permissionKeys.includes("manage.all")) {
    return true;
  }
  if (actor.permissionKeys.includes(permission.key)) {
    return true;
  }
  const moduleKey = permission.moduleKey;
  return actor.permissionKeys.some(
    (k) => k === `${moduleKey}.manage` || k.startsWith(`${moduleKey}.`),
  );
}

const ACTION_MAP: Record<string, Actions> = {
  view: "view",
  create: "create",
  update: "update",
  delete: "delete",
  cancel: "cancel",
  refund: "refund",
  manage: "manage",
  disable: "disable",
  assign: "assign",
};

/** permission key format: module.action e.g. customers.view */
export function permissionKeyToRule(key: string): AppRawRule | null {
  const [moduleKey, actionKey] = key.split(".");
  if (!moduleKey || !actionKey) return null;
  const action = ACTION_MAP[actionKey];
  if (!action) return null;
  return { action, subject: moduleKey as Subjects };
}

export function defineAbilityFor(input: {
  isPlatformAdmin?: boolean;
  permissionKeys: string[];
  enabledModuleKeys: string[];
}): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (input.isPlatformAdmin) {
    can("manage", "all");
    return build();
  }

  const enabled = new Set(input.enabledModuleKeys);

  for (const key of input.permissionKeys) {
    const rule = permissionKeyToRule(key);
    if (!rule) continue;
    const subject = rule.subject as string;
    if (!isModuleExempt(subject)) {
      if (!enabled.has(subject) && !enabled.has(moduleKeyFromSubject(subject))) {
        continue;
      }
    }
    can(rule.action as Actions, rule.subject as Subjects);
  }

  if (enabled.has("dashboard") || input.permissionKeys.includes("dashboard.view")) {
    can("view", "dashboard");
  }

  return build();
}

function moduleKeyFromSubject(subject: string): string {
  return subject;
}

export function canAccessModule(
  enabledModuleKeys: string[],
  permissionKeys: string[],
  moduleKey: string,
  viewPermission = `${moduleKey}.view`,
): boolean {
  if (!isModuleExempt(moduleKey) && !enabledModuleKeys.includes(moduleKey)) {
    return false;
  }
  return (
    permissionKeys.includes(viewPermission) ||
    permissionKeys.includes(`${moduleKey}.manage`) ||
    permissionKeys.includes("manage.all")
  );
}
