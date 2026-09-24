import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Customer Profile" };

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await resolveTenantContext();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, businessId: ctx.businessId },
    include: {
      documents: {
        include: { template: true },
        orderBy: { createdAt: "desc" },
      },
      memberships: {
        include: { product: true },
      }
    }
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={customer.email || "No email"}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documents & Waivers</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents on file.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.template.name}</TableCell>
                      <TableCell>
                        <Badge variant={doc.status === "SIGNED" ? "default" : "secondary"}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.signedAt ? format(doc.signedAt, "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active memberships.</p>
            ) : (
              <div className="space-y-4">
                {customer.memberships.map(m => (
                  <div key={m.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{m.product.name}</div>
                      <div className="text-xs text-muted-foreground">Expires: {format(m.endDate, "MMM d, yyyy")}</div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
