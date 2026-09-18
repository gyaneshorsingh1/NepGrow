import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
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

import { EditModuleCard } from "./module-forms";

export const metadata = { title: "Modules" };

export default async function AdminModulesPage() {
  const [modules, categories] = await Promise.all([
    prisma.module.findMany({
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.businessCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Create and manage feature modules available to plans and businesses."
        actions={
          <Button asChild>
            <Link href="/admin/modules/new">+ Create Module</Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Href</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No modules yet.
                </TableCell>
              </TableRow>
            ) : (
              modules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-medium">{mod.name}</TableCell>
                  <TableCell className="font-mono text-xs">{mod.key}</TableCell>
                  <TableCell>{mod.category?.name ?? "Core"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {mod.href ?? "—"}
                  </TableCell>
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Edit modules</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {modules.map((mod) => (
            <EditModuleCard
              key={mod.id}
              module={{
                id: mod.id,
                key: mod.key,
                name: mod.name,
                description: mod.description,
                categoryId: mod.categoryId,
                isCore: mod.isCore,
                sortOrder: mod.sortOrder,
                icon: mod.icon,
                href: mod.href,
              }}
              categories={categoryOptions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
