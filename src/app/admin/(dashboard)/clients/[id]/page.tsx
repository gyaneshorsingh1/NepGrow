import { notFound } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

import { ClientStatusActions } from "./client-status-actions";
import { EditClientForm } from "./edit-client-form";
import { ClientEntitlementsForm } from "./client-entitlements-form";
import { ClientUsersPanel } from "./client-users-panel";
import { ClientDetailTabs } from "./client-detail-tabs";

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
      roles: { orderBy: { name: "asc" } },
      memberships: {
        include: {
          user: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true, email: true } } },
      },
      website: true,
      _count: { select: { memberships: true, customers: true, bookings: true } },
    },
  });

  if (!business) notFound();

  const [plans, catalogModules] = await Promise.all([
    prisma.plan.findMany({
      where: {
        OR: [{ categoryId: business.categoryId }, { categoryId: null }],
        status: "ACTIVE",
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.module.findMany({
      where: {
        OR: [
          { isCore: true },
          { categoryId: business.categoryId },
          { categoryId: null },
        ],
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const enabledMap = new Map(
    business.businessModules.map((bm) => [bm.moduleId, bm.enabled]),
  );

  const sitePath = `/sites/${business.category.domainSlug}/${business.slug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={business.name}
        description={`${business.email} · ${business.category.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={sitePath} target="_blank">
                View website
              </Link>
            </Button>
            <ClientStatusActions
              businessId={business.id}
              status={business.status}
            />
          </div>
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
                {formatMoney(
                  business.subscription.plan.priceCents,
                  business.subscription.plan.currency,
                )} /{" "}
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

      <ClientDetailTabs
        profile={
          <Card>
            <CardHeader>
              <CardTitle>Business profile</CardTitle>
            </CardHeader>
            <CardContent>
              <EditClientForm
                businessId={business.id}
                defaults={{
                  name: business.name,
                  email: business.email,
                  phone: business.phone,
                  address: business.address,
                  description: business.description,
                  status: business.status,
                }}
              />
            </CardContent>
          </Card>
        }
        subscription={
          <Card>
            <CardHeader>
              <CardTitle>Subscription & modules</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientEntitlementsForm
                businessId={business.id}
                currentPlanId={business.subscription?.planId}
                plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                modules={catalogModules.map((m) => ({
                  id: m.id,
                  name: m.name,
                  key: m.key,
                  enabled: enabledMap.get(m.id) ?? false,
                }))}
              />
            </CardContent>
          </Card>
        }
        users={
          <Card>
            <CardHeader>
              <CardTitle>Users & roles</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientUsersPanel
                businessId={business.id}
                users={business.memberships.map((m) => ({
                  membershipId: m.id,
                  userId: m.userId,
                  name: m.user.name,
                  email: m.user.email,
                  status: m.status,
                  roles: m.roles.map((r) => r.role.name),
                }))}
              />
            </CardContent>
          </Card>
        }
        activity={
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {business.activityLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                business.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user?.name || log.user?.email || "System"}
                        {log.module ? ` · ${log.module}` : ""}
                      </p>
                    </div>
                    <Badge variant="muted">
                      {log.createdAt
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
