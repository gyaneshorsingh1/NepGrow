"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateWebsiteContentAction } from "@/features/websites/actions";
import { updateWebsiteContentSchema } from "@/lib/validation/schemas";

type Values = z.output<typeof updateWebsiteContentSchema>;

type Props = {
  defaults: Values;
  canUpdate: boolean;
};

export function WebsiteContentForm({ defaults, canUpdate }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(updateWebsiteContentSchema) as Resolver<Values>,
    defaultValues: defaults,
  });

  async function onSubmit(values: Values) {
    if (!canUpdate) {
      toast.error("You do not have permission to update website settings");
      return;
    }
    setPending(true);
    const result = await updateWebsiteContentAction(values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Website content saved");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="heroHeadline">Hero headline</Label>
        <Input
          id="heroHeadline"
          disabled={!canUpdate}
          {...form.register("heroHeadline")}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="heroSubheadline">Hero subheadline</Label>
        <Input
          id="heroSubheadline"
          disabled={!canUpdate}
          {...form.register("heroSubheadline")}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          rows={4}
          disabled={!canUpdate}
          {...form.register("about")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact email</Label>
        <Input
          id="contactEmail"
          type="email"
          disabled={!canUpdate}
          {...form.register("contactEmail")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact phone</Label>
        <Input
          id="contactPhone"
          disabled={!canUpdate}
          {...form.register("contactPhone")}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          disabled={!canUpdate}
          {...form.register("address")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seoTitle">SEO title</Label>
        <Input
          id="seoTitle"
          disabled={!canUpdate}
          {...form.register("seoTitle")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seoDescription">SEO description</Label>
        <Input
          id="seoDescription"
          disabled={!canUpdate}
          {...form.register("seoDescription")}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          disabled={!canUpdate}
          checked={form.watch("indexable")}
          onChange={(e) => form.setValue("indexable", e.target.checked)}
        />
        Indexable (allow search engines)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          disabled={!canUpdate}
          checked={form.watch("published")}
          onChange={(e) => form.setValue("published", e.target.checked)}
        />
        Published
      </label>
      {canUpdate ? (
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save website content"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
