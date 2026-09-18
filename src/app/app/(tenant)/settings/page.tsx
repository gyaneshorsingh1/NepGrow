import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  authorize,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { listCurrencies } from "@/server/services/currencies";

import { BusinessCurrencyForm } from "./business-currency-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await resolveTenantContext();
  await authorize(ctx, "view", "settings", "settings");

  const canUpdate =
    ctx.ability.can("update", "settings") || ctx.isPlatformAdmin;

  const [business, currencies] = await Promise.all([
    prisma.business.findUnique({
      where: { id: ctx.businessId },
      include: {
        category: true,
        subscription: { include: { plan: true } },
        website: true,
      },
    }),
    listCurrencies({ activeOnly: true }),
  ]);

  if (!business) {
    return <p className="text-sm text-muted-foreground">Business not found.</p>;
  }

  // Ensure current currency appears even if inactive in catalog
  const currencyOptions = [...currencies];
  if (!currencyOptions.some((c) => c.code === business.currency)) {
    currencyOptions.unshift({
      id: "current",
      code: business.currency,
      name: business.currency,
      symbol: null,
      decimals: 2,
      status: "ACTIVE",
      sortOrder: -1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Business profile, currency, and subscription details."
        actions={
          <Button asChild size="sm">
            <Link href="/app/settings/website">Edit website content</Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{business.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{business.category.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{business.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{business.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{business.address ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timezone</p>
              <p className="font-medium">{business.timezone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <StatusBadge status={business.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pricing currency</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessCurrencyForm
              currentCode={business.currency}
              currencies={currencyOptions.map((c) => ({
                code: c.code,
                name: c.name,
                symbol: c.symbol,
              }))}
              canUpdate={canUpdate}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan & website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Plan</p>
              <p className="font-medium">
                {business.subscription?.plan.name ?? "No plan"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Subscription</p>
              {business.subscription ? (
                <StatusBadge status={business.subscription.status} />
              ) : (
                <p>—</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Public slug</p>
              <p className="font-mono text-xs">
                /sites/{business.category.domainSlug}/{business.slug}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Website</p>
              <p className="font-medium">
                {business.website?.published ? "Published" : "Unpublished"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/settings/website">Edit website content</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
