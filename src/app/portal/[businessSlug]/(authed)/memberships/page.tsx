import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getPortalSession } from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "Memberships" };

export default async function PortalMembershipsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();
  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const [memberships, programs] = await Promise.all([
    prisma.membership.findMany({
      where: { customerId: session.customer.id },
      include: { product: true },
      orderBy: { endDate: "desc" },
    }),
    prisma.customProgram.findMany({
      where: { customerId: session.customer.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Memberships & programs
        </h1>
        <p className="text-sm text-muted-foreground">
          Your plans and assigned training programs.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Memberships</h2>
        {memberships.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No memberships on file.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {memberships.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid until</span>
                    <span>{format(m.endDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={m.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Programs</h2>
        {programs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No active programs.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="line-clamp-4 whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                    {String(p.content)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
