"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createTenantUserAction } from "@/features/clients/actions";

type RoleOption = { id: string; name: string };

export function CreateClientUserForm({
  businessId,
  roles,
}: {
  businessId: string;
  roles: RoleOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTenantUserAction({
        businessId,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        roleId: String(fd.get("roleId") ?? "") || undefined,
        status: String(fd.get("status") ?? "ACTIVE"),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("User created");
      router.push(`/admin/clients/${businessId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roleId">Role</Label>
        <Select id="roleId" name="roleId" defaultValue={roles[0]?.id}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </Select>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href={`/admin/clients/${businessId}`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add user"}
        </Button>
      </div>
    </form>
  );
}
