import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

export const metadata = { title: "Category" };

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.businessCategory.findUnique({
    where: { id },
    include: {
      subcategories: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
      modules: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, key: true, isCore: true },
      },
      _count: { select: { businesses: true, plans: true } },
    },
  });
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        description="Category details and related catalog records."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/categories">Back to categories</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardDetail label="Slug" value={category.slug} mono />
        <CardDetail label="Domain" value={category.domainSlug} mono />
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <StatusBadge status={category.status} />
        </div>
        {category.description ? (
          <CardDetail label="Description" value={category.description} full />
        ) : null}
        <CardDetail label="Businesses" value={String(category._count.businesses)} />
        <CardDetail label="Plans" value={String(category._count.plans)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategories</TableHead>
                <TableHead>Slug</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.subcategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    No active subcategories.
                  </TableCell>
                </TableRow>
              ) : (
                category.subcategories.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="font-mono text-xs">{sub.slug}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modules</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.modules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No modules for this category.
                  </TableCell>
                </TableRow>
              ) : (
                category.modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.name}</TableCell>
                    <TableCell className="font-mono text-xs">{mod.key}</TableCell>
                    <TableCell>
                      <Badge variant={mod.isCore ? "secondary" : "outline"}>
                        {mod.isCore ? "Core" : "Vertical"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CardDetail({
  label,
  value,
  mono = false,
  full = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 ${full ? "sm:col-span-2 lg:col-span-1" : ""}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-medium ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}