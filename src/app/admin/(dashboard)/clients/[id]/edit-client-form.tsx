"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateClientProfileAction } from "@/features/clients/actions";

type Props = {
  businessId: string;
  defaults: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    description?: string | null;
    status: string;
  };
};

export function EditClientForm({ businessId, defaults }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateClientProfileAction({
        businessId,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        phone: String(fd.get("phone") ?? "") || undefined,
        address: String(fd.get("address") ?? "") || undefined,
        description: String(fd.get("description") ?? "") || undefined,
        status: String(fd.get("status") ?? "ACTIVE"),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Client updated");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Business name</Label>
          <Input id="name" name="name" defaultValue={defaults.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={defaults.status}>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={defaults.address ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
