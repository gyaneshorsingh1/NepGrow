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
  | "refund";

export type Subjects =
  | "all"
  | "dashboard"
  | "customers"
  | "bookings"
  | "facilities"
  | "courts"
  | "memberships"
  | "payments"
  | "staff"
  | "reports"
  | "settings"
  | "users"
  | "roles"
  | "clients"
  | "plans"
  | "modules"
  | "activity"
  | "websites";

export type AppAbility = MongoAbility<[Actions, Subjects]>;
export type AppRawRule = RawRuleOf<AppAbility>;

const ACTION_MAP: Record<string, Actions> = {
  view: "view",
  create: "create",
  update: "update",
  delete: "delete",
  cancel: "cancel",
  refund: "refund",
  manage: "manage",
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
    if (subject !== "all" && subject !== "dashboard" && subject !== "settings") {
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
  if (!enabledModuleKeys.includes(moduleKey) && moduleKey !== "dashboard" && moduleKey !== "settings") {
    return false;
  }
  return (
    permissionKeys.includes(viewPermission) ||
    permissionKeys.includes(`${moduleKey}.manage`) ||
    permissionKeys.includes("manage.all")
  );
}
