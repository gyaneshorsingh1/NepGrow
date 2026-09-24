import Link from "next/link";
import { format } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Message Templates" };

export default async function TemplatesPage() {
  const ctx = await resolveTenantContext();

  const templates = await prisma.notificationTemplate.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Templates"
        description="Manage your pre-written email and SMS templates."
        actions={
          <Button asChild>
            <Link href="/app/communications/templates/new">+ Create Template</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No templates found. Create one to start automating!
                </TableCell>
              </TableRow>
            )}
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.type}</TableCell>
                <TableCell>{template.subject || "—"}</TableCell>
                <TableCell>{format(template.updatedAt, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <StatusBadge status={template.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
