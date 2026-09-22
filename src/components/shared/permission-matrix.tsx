"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { actorCanGrantPermission } from "@/lib/authorization/ability";
import { cn } from "@/lib/utils";

export type PermissionOption = {
  id: string;
  key: string;
  name: string;
  moduleKey: string;
};

type PermissionMatrixProps = {
  permissions: PermissionOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  /** Actor's permission keys — used to decide which checkboxes can be toggled. */
  actorPermissionKeys?: string[];
  isPlatformAdmin?: boolean;
};

export function PermissionMatrix({
  permissions,
  value,
  onChange,
  disabled,
  actorPermissionKeys,
  isPlatformAdmin = false,
}: PermissionMatrixProps) {
  const [search, setSearch] = React.useState("");
  const selected = new Set(value);
  const actorKeys = actorPermissionKeys ?? [];

  function canToggle(permission: PermissionOption) {
    if (disabled) return false;
    if (actorPermissionKeys === undefined) return true;
    return actorCanGrantPermission(
      { permissionKeys: actorKeys, isPlatformAdmin },
      permission,
    );
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.key.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.moduleKey.toLowerCase().includes(q),
    );
  }, [permissions, search]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, PermissionOption[]>();
    for (const p of filtered) {
      const list = map.get(p.moduleKey) ?? [];
      list.push(p);
      map.set(p.moduleKey, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggle(permission: PermissionOption, checked: boolean) {
    if (!canToggle(permission)) return;
    if (checked) {
      onChange(
        [...selected, permission.id].filter((x, i, a) => a.indexOf(x) === i),
      );
    } else {
      onChange(value.filter((x) => x !== permission.id));
    }
  }

  function setModule(moduleKey: string, checked: boolean) {
    const modulePerms = permissions.filter(
      (p) => p.moduleKey === moduleKey && canToggle(p),
    );
    const moduleIds = modulePerms.map((p) => p.id);
    if (!moduleIds.length) return;
    if (checked) {
      onChange([...new Set([...value, ...moduleIds])]);
    } else {
      const drop = new Set(moduleIds);
      onChange(value.filter((id) => !drop.has(id)));
    }
  }

  function selectAll() {
    const ids = filtered.filter((p) => canToggle(p)).map((p) => p.id);
    onChange([...new Set([...value, ...ids])]);
  }

  function deselectAll() {
    const drop = new Set(filtered.filter((p) => canToggle(p)).map((p) => p.id));
    onChange(value.filter((id) => !drop.has(id)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search permissions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={disabled || !filtered.length}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={disabled}
          >
            Deselect all
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Off permissions stay listed. If you have access to that module, you can
        turn them On again.
      </p>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permissions match.</p>
      ) : (
        grouped.map(([moduleKey, perms]) => {
          const toggleable = perms.filter((p) => canToggle(p));
          const allChecked =
            toggleable.length > 0 &&
            toggleable.every((p) => selected.has(p.id));
          const someChecked = toggleable.some((p) => selected.has(p.id));
          return (
            <div
              key={moduleKey}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium capitalize">{moduleKey}</h3>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={allChecked}
                    onChange={(e) => setModule(moduleKey, e.target.checked)}
                    disabled={disabled || toggleable.length === 0}
                    aria-label={`Select all ${moduleKey}`}
                    className={
                      someChecked && !allChecked ? "opacity-70" : undefined
                    }
                  />
                  Module select all
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((p) => {
                  const checked = selected.has(p.id);
                  const locked = !canToggle(p);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border border-transparent p-2 text-sm",
                        checked
                          ? "border-primary/20 bg-primary/5"
                          : "bg-muted/30",
                        locked && "opacity-60",
                      )}
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        disabled={disabled || locked}
                        onChange={(e) => toggle(p, e.target.checked)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              checked
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {checked ? "On" : "Off"}
                          </span>
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {p.key}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
