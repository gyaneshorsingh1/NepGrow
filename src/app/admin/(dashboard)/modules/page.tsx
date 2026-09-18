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
            </TableRow>
          </TableHeader>
          <TableBody>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
