<<<<<<< Updated upstream
=======
import Link from "next/link";
import { Pencil } from "lucide-react";

>>>>>>> Stashed changes
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

export const metadata = { title: "Modules" };

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description="Feature modules that can be enabled per plan or business."
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
