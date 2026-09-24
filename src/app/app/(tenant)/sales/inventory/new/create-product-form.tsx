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
import { createProductAction, createProductSchema } from "@/features/pos/actions";

type Values = z.infer<typeof createProductSchema>;

export function CreateProductForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(createProductSchema) as Resolver<Values>,
    defaultValues: { name: "", description: "", priceCents: 0, stockLevel: 0, sku: "" },
  });

  async function onSubmit(values: Values) {
    setPending(true);
    // Real implementation should handle decimal -> cents conversion. Assuming input is simple integer here for MVP.
    const result = await createProductAction(businessId, values);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product added successfully!");
    router.push("/app/sales/inventory");
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-4 md:grid-cols-2 max-w-xl"
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sku">SKU / Barcode</Label>
        <Input id="sku" {...form.register("sku")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="priceCents">Price (in cents/paisa for now)</Label>
        <Input id="priceCents" type="number" {...form.register("priceCents")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="stockLevel">Initial Stock Level</Label>
        <Input id="stockLevel" type="number" {...form.register("stockLevel")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...form.register("description")} />
      </div>
      <div className="flex gap-2 md:col-span-2 mt-4">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/app/sales/inventory">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}
