import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
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

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await resolveTenantContext();
  await authorize(ctx, "view", "settings", "settings");

  const business = await prisma.business.findUnique({
    where: { id: ctx.businessId },
    include: {
      category: true,
      subscription: { include: { plan: true } },
      website: true,
    },
  });

  if (!business) {
    return <p className="text-sm text-muted-foreground">Business not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Business profile and subscription details."
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
