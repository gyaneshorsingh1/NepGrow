"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTemplateAction, createTemplateSchema } from "@/features/notifications/actions";

type Values = z.infer<typeof createTemplateSchema>;

export function CreateTemplateForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createTemplateSchema) as Resolver<Values>,
    defaultValues: { name: "", subject: "", body: "" },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    const result = await createTemplateAction(businessId, values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Template created successfully!");
    router.push("/app/communications/templates");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 max-w-2xl"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Internal Name (e.g., &quot;Welcome Email&quot;)</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject Line (For Emails)</Label>
        <Input id="subject" {...form.register("subject")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message Body</Label>
        <Textarea id="body" rows={6} {...form.register("body")} placeholder="Use {{name}} for customer's name." />
        {form.formState.errors.body && (
          <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/communications/templates">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
