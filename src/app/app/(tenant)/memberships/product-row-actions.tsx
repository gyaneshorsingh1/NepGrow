"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  deleteMembershipProductAction,
  setMembershipProductStatusAction,
  updateMembershipProductAction,
} from "@/features/memberships/actions";
import { updateMembershipProductSchema } from "@/lib/validation/schemas";
import { formatMoney } from "@/lib/utils";

const formSchema = updateMembershipProductSchema;

type Values = z.infer<typeof formSchema>;

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationDays: number;
  status: string;
  benefits: string[];
  activeCount: number;
  historyCount: number;
};

export function ProductRowActions({
  product,
  canUpdate,
  canDelete,
  currency,
  currencyDecimals = 2,
}: {
  product: Product;
  canUpdate: boolean;
  canDelete: boolean;
  currency: string;
  currencyDecimals?: number;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(formSchema) as Resolver<Values>,
    defaultValues: {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      priceCents: product.priceCents,
      durationDays: product.durationDays,
      benefits: product.benefits.join("\n"),
      status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
  });

  React.useEffect(() => {
    form.reset({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      priceCents: product.priceCents,
      durationDays: product.durationDays,
      benefits: product.benefits.join("\n"),
      status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  }, [product, form]);

  async function onSave(values: Values) {
    setPending(true);
    const result = await updateMembershipProductAction({
      id: values.id,
      name: values.name,
      description: values.description,
      priceCents: Number(values.priceCents),
      durationDays: values.durationDays,
      benefits: values.benefits,
      status: values.status,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Plan updated");
    setEditOpen(false);
    router.refresh();
  }

  async function toggleStatus() {
    const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setPending(true);
    const result = await setMembershipProductStatusAction({
      id: product.id,
      status: next,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(next === "ACTIVE" ? "Plan activated" : "Plan deactivated");
    router.refresh();
  }

  async function onDelete() {
    const result = await deleteMembershipProductAction({ id: product.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.data.deactivated
        ? "Plan deactivated (has membership history)"
        : "Plan deleted",
    );
    router.refresh();
  }

  const step =
    currencyDecimals > 0 ? `0.${"1".padStart(currencyDecimals, "0")}` : "1";

  return (
    <>
      <div className="flex justify-end gap-1">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {canUpdate ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={() => setEditOpen(true)}
                disabled={pending}
              >
                <Pencil aria-hidden />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={product.status === "ACTIVE" ? "Deactivate" : "Activate"}
                onClick={toggleStatus}
                disabled={pending}
              >
                <Power aria-hidden />
                <span className="sr-only">
                  {product.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </span>
              </Button>
            </>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={product.historyCount > 0 ? "Archive" : "Delete"}
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              <Trash2 aria-hidden />
              <span className="sr-only">
                {product.historyCount > 0 ? "Archive" : "Delete"}
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`name-${product.id}`}>Plan Name</Label>
              <Input id={`name-${product.id}`} {...form.register("name")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`price-${product.id}`}>Price</Label>
                <Input
                  id={`price-${product.id}`}
                  type="number"
                  step={step}
                  min={0}
                  {...form.register("priceCents")}
                />
                <p className="text-xs text-muted-foreground">
                  Current:{" "}
                  {formatMoney(product.priceCents, currency, currencyDecimals)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`days-${product.id}`}>Duration (days)</Label>
                <Input
                  id={`days-${product.id}`}
                  type="number"
                  {...form.register("durationDays")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`status-${product.id}`}>Status</Label>
              <Select id={`status-${product.id}`} {...form.register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`desc-${product.id}`}>Description</Label>
              <Textarea
                id={`desc-${product.id}`}
                rows={2}
                {...form.register("description")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`benefits-${product.id}`}>Benefits</Label>
              <Textarea
                id={`benefits-${product.id}`}
                rows={3}
                {...form.register("benefits")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Active memberships: {product.activeCount}. Changing price does not
              rewrite historical membership prices.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={product.historyCount > 0 ? "Archive plan?" : "Delete plan?"}
        description={
          product.historyCount > 0
            ? "This plan has membership history and will be deactivated instead of deleted."
            : "This will permanently delete the plan."
        }
        confirmLabel={product.historyCount > 0 ? "Deactivate" : "Delete"}
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
