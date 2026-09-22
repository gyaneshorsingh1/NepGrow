"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/features/catalog/actions";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  domainSlug: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
};

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

export function CreateCategoryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCategoryAction({
        name: String(fd.get("name") ?? ""),
        slug: String(fd.get("slug") ?? ""),
        domainSlug: String(fd.get("domainSlug") ?? ""),
        description: emptyToUndefined(fd.get("description")),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Category created");
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-category-name">Name</Label>
          <Input id="create-category-name" name="name" placeholder="Wellness" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-category-slug">Slug</Label>
          <Input
            id="create-category-slug"
            name="slug"
            placeholder="wellness"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="create-category-domain">Domain</Label>
          <Input
            id="create-category-domain"
            name="domainSlug"
            placeholder="wellness.nepgrow.com"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="create-category-description">Description</Label>
          <Textarea
            id="create-category-description"
            name="description"
            rows={2}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/categories">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          Create category
        </Button>
      </div>
    </form>
  );
}

export function CategoryRowActions({ category }: { category: CategoryRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(category.name);
  const [slug, setSlug] = React.useState(category.slug);
  const [domainSlug, setDomainSlug] = React.useState(category.domainSlug);
  const [description, setDescription] = React.useState(
    category.description ?? "",
  );
  const [status, setStatus] = React.useState(category.status);

  React.useEffect(() => {
    if (!open) return;
    setName(category.name);
    setSlug(category.slug);
    setDomainSlug(category.domainSlug);
    setDescription(category.description ?? "");
    setStatus(category.status);
  }, [open, category]);

  function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCategoryAction({
        id: category.id,
        name,
        slug,
        domainSlug,
        description: description.trim() || undefined,
        status,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Category updated");
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm(`Disable category “${category.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteCategoryAction({ id: category.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Category disabled");
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="icon" title="View">
        <Link href={`/admin/categories/${category.id}`}>
          <Eye aria-hidden />
          <span className="sr-only">View</span>
        </Link>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Edit"
          disabled={pending}
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden />
          <span className="sr-only">Edit</span>
        </Button>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`category-name-${category.id}`}>Name</Label>
                <Input
                  id={`category-name-${category.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`category-slug-${category.id}`}>Slug</Label>
                <Input
                  id={`category-slug-${category.id}`}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`category-domain-${category.id}`}>Domain</Label>
                <Input
                  id={`category-domain-${category.id}`}
                  value={domainSlug}
                  onChange={(e) => setDomainSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`category-status-${category.id}`}>Status</Label>
                <Select
                  id={`category-status-${category.id}`}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ACTIVE" | "INACTIVE")
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`category-description-${category.id}`}>
                  Description
                </Label>
                <Textarea
                  id={`category-description-${category.id}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Delete"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={onDelete}
      >
        <Trash2 aria-hidden />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}