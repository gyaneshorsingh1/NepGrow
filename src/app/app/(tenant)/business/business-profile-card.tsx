"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfileAction } from "@/features/settings/actions";

type BusinessProfile = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  timezone: string;
  currency: string;
  status: string;
  categoryName: string;
  planName: string | null;
};

export function BusinessProfileCard({
  business,
  canUpdate,
}: {
  business: BusinessProfile;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: business.name,
    email: business.email,
    phone: business.phone ?? "",
    address: business.address ?? "",
    description: business.description ?? "",
    timezone: business.timezone,
  });

  React.useEffect(() => {
    if (editing) return;
    setForm({
      name: business.name,
      email: business.email,
      phone: business.phone ?? "",
      address: business.address ?? "",
      description: business.description ?? "",
      timezone: business.timezone,
    });
  }, [business, editing]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await updateBusinessProfileAction(form);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Business details saved");
    setEditing(false);
    router.refresh();
  }

  function onCancel() {
    setForm({
      name: business.name,
      email: business.email,
      phone: business.phone ?? "",
      address: business.address ?? "",
      description: business.description ?? "",
      timezone: business.timezone,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Business details</h2>
          {canUpdate ? (
            <Button type="button" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={business.name} />
          <Field label="Category" value={business.categoryName} />
          <Field label="Email" value={business.email} />
          <Field label="Phone" value={business.phone || "—"} />
          <Field label="Address" value={business.address || "—"} />
          <Field label="Timezone" value={business.timezone} />
          <Field label="Currency" value={business.currency} />
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={business.status} />
          </div>
          <Field label="Plan" value={business.planName || "—"} />
          <div className="sm:col-span-2">
            <Field label="Description" value={business.description || "—"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Edit business details</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="biz-name">Business name</Label>
          <Input
            id="biz-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-email">Email</Label>
          <Input
            id="biz-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-phone">Phone</Label>
          <Input
            id="biz-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-timezone">Timezone</Label>
          <Input
            id="biz-timezone"
            required
            value={form.timezone}
            onChange={(e) =>
              setForm((f) => ({ ...f, timezone: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-address">Address</Label>
          <Input
            id="biz-address"
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="biz-description">Description</Label>
          <Textarea
            id="biz-description"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Category, currency, and plan are managed in Settings.
        </p>
      </div>
    </form>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium whitespace-pre-wrap">{value}</p>
    </div>
  );
}
