import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

import { ClientStatusActions } from "./client-status-actions";

export const metadata = { title: "Client detail" };

type Params = Promise<{ id: string }>;

export default async function ClientDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      category: true,
      subscription: { include: { plan: true } },
      businessModules: { include: { module: true } },
      _count: { select: { memberships: true, customers: true, bookings: true } },
    },
  });

  if (!business) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={business.name}
        description={`${business.email} · ${business.category.name}`}
        actions={
          <ClientStatusActions
            businessId={business.id}
            status={business.status}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={business.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {business.subscription?.plan.name ?? "No plan"}
            </p>
            {business.subscription?.plan ? (
              <p className="text-xs text-muted-foreground">
                {formatMoney(business.subscription.plan.priceCents)} /{" "}
                {business.subscription.plan.billingInterval.toLowerCase()}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{business._count.memberships}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Slug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{business.slug}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enabled modules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {business.businessModules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules enabled.</p>
          ) : (
            business.businessModules.map((bm) => (
              <Badge key={bm.id} variant={bm.enabled ? "secondary" : "muted"}>
                {bm.module.name}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
