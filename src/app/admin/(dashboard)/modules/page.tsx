<<<<<<< HEAD
<<<<<<< Updated upstream
=======
import Link from "next/link";
import { Pencil } from "lucide-react";

>>>>>>> Stashed changes
=======
import Link from "next/link";

>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
<<<<<<< HEAD
<<<<<<< Updated upstream
            {modules.map((mod) => (
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
            ))}
=======
            {modules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No modules yet.
                </TableCell>
              </TableRow>
=======
            {modules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No modules yet.
                </TableCell>
              </TableRow>
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
<<<<<<< HEAD
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link href={`/admin/modules/${mod.id}`}>
                        <Pencil aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
>>>>>>> Stashed changes
=======
                </TableRow>
              ))
            )}
>>>>>>> ba29daae3a9f89933048278c073c16523f9d9696
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
