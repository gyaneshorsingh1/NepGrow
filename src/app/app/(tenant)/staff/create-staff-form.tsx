"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createStaffAction } from "@/features/sports/actions";

export function CreateStaffForm({
  roles,
}: {
  roles: { id: string; name: string; key: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const defaultRoleId =
    roles.find((r) => r.key === "trainer")?.id ?? roles[0]?.id ?? "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const result = await createStaffAction({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      roleId: String(fd.get("roleId") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      title: String(fd.get("title") ?? "") || undefined,
      hourlyRateCents: Number(fd.get("hourlyRateCents") ?? 0),
      status: String(fd.get("status") ?? "ACTIVE"),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Staff profile and login created");
    router.push("/app/staff/profiles");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Login email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roleId">App role</Label>
          <Select id="roleId" name="roleId" defaultValue={defaultRoleId} required>
            {roles.length === 0 ? (
              <option value="">No roles available</option>
            ) : (
              roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls what they can see after signing in at /app/login.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Coach, Front desk…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hourlyRateCents">Hourly rate</Label>
          <Input
            id="hourlyRateCents"
            name="hourlyRateCents"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
          />
          <p className="text-xs text-muted-foreground">
            Used when customers book this staff member.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/staff/profiles">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || roles.length === 0}>
          {pending ? "Saving…" : "Add staff"}
        </Button>
      </div>
    </form>
  );
}
