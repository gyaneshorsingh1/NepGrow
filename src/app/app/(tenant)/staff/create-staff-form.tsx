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

export function CreateStaffForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const result = await createStaffAction({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? "") || undefined,
      phone: String(fd.get("phone") ?? "") || undefined,
      title: String(fd.get("title") ?? "") || undefined,
      status: String(fd.get("status") ?? "ACTIVE"),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Staff member added");
    router.push("/app/staff");
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
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
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
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/staff">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add staff"}
        </Button>
      </div>
    </form>
  );
}
