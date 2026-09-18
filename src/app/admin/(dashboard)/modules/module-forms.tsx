"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createModuleAction,
  deleteModuleAction,
  updateModuleAction,
} from "@/features/catalog/actions";

type CategoryOption = { id: string; name: string };
type ModuleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  isCore: boolean;
  sortOrder: number;
  icon: string | null;
  href: string | null;
};

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

export function CreateModuleForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createModuleAction({
        key: String(fd.get("key") ?? ""),
        name: String(fd.get("name") ?? ""),
        description: emptyToUndefined(fd.get("description")),
        categoryId: emptyToUndefined(fd.get("categoryId")) ?? null,
        isCore: fd.get("isCore") === "on",
        sortOrder: Number(fd.get("sortOrder") ?? 0),
        icon: emptyToUndefined(fd.get("icon")),
        href: emptyToUndefined(fd.get("href")),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Module created");
      router.push("/admin/modules");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-module-name">Name</Label>
          <Input id="create-module-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-module-key">Key</Label>
          <Input
            id="create-module-key"
            name="key"
            placeholder="bookings"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="create-module-description">Description</Label>
          <Textarea
            id="create-module-description"
            name="description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-module-category">Category</Label>
          <Select id="create-module-category" name="categoryId" defaultValue="">
            <option value="">Core / platform</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-module-href">Href</Label>
          <Input
            id="create-module-href"
            name="href"
            placeholder="/app/bookings"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-module-icon">Icon</Label>
          <Input
            id="create-module-icon"
            name="icon"
            placeholder="Calendar"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-module-sort">Sort order</Label>
          <Input
            id="create-module-sort"
            name="sortOrder"
            type="number"
            defaultValue={0}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isCore" />
            Core module
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/modules">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          Create module
        </Button>
      </div>
    </form>
  );
}

export function EditModuleCard({
  module: mod,
  categories,
}: {
  module: ModuleRow;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateModuleAction({
        id: mod.id,
        key: String(fd.get("key") ?? ""),
        name: String(fd.get("name") ?? ""),
        description: emptyToUndefined(fd.get("description")) ?? null,
        categoryId: emptyToUndefined(fd.get("categoryId")) ?? null,
        isCore: fd.get("isCore") === "on",
        sortOrder: Number(fd.get("sortOrder") ?? 0),
        icon: emptyToUndefined(fd.get("icon")) ?? null,
        href: emptyToUndefined(fd.get("href")) ?? null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Module updated");
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteModuleAction({ id: mod.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Module deleted");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{mod.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{mod.key}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>

      <form onSubmit={onUpdate} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`module-name-${mod.id}`}>Name</Label>
            <Input
              id={`module-name-${mod.id}`}
              name="name"
              defaultValue={mod.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-key-${mod.id}`}>Key</Label>
            <Input
              id={`module-key-${mod.id}`}
              name="key"
              defaultValue={mod.key}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`module-description-${mod.id}`}>Description</Label>
            <Textarea
              id={`module-description-${mod.id}`}
              name="description"
              rows={2}
              defaultValue={mod.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-category-${mod.id}`}>Category</Label>
            <Select
              id={`module-category-${mod.id}`}
              name="categoryId"
              defaultValue={mod.categoryId ?? ""}
            >
              <option value="">Core / platform</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-href-${mod.id}`}>Href</Label>
            <Input
              id={`module-href-${mod.id}`}
              name="href"
              defaultValue={mod.href ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-icon-${mod.id}`}>Icon</Label>
            <Input
              id={`module-icon-${mod.id}`}
              name="icon"
              defaultValue={mod.icon ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-sort-${mod.id}`}>Sort order</Label>
            <Input
              id={`module-sort-${mod.id}`}
              name="sortOrder"
              type="number"
              defaultValue={mod.sortOrder}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="isCore" defaultChecked={mod.isCore} />
              Core module
            </label>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          Save module
        </Button>
      </form>
    </div>
  );
}
