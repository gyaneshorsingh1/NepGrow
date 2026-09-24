import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Documents & Waivers" };

export default async function DocumentsPage() {
  const ctx = await resolveTenantContext();

  const templates = await prisma.documentTemplate.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents & Waivers"
        description="Manage digital agreements that customers must sign."
        actions={
          <Button asChild>
            <Link href="/app/settings/documents/new">+ New Template</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Required for Entry</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No document templates found.
                </TableCell>
              </TableRow>
            )}
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.isRequired ? "Yes" : "No"}</TableCell>
                <TableCell>{format(template.createdAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <StatusBadge status={template.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
