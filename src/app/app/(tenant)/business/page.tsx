import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/server/services/business";

import { BusinessProfileCard } from "./business-profile-card";

export const metadata = { title: "Business" };

export default async function BusinessPage() {
  const session = await getSession();
  const ctx = await resolveTenantContext();

  let business;
  try {
    business = await getBusinessProfile(ctx);
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need settings.view to see business details." />
      );
    }
    throw error;
  }

  const canUpdate =
    ctx.ability.can("update", "settings") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title={business.name}
        description={
          session?.user?.name
            ? `Signed in as ${session.user.name}`
            : "Your business profile"
        }
      />
      <Card>
        <CardContent className="pt-6">
          <BusinessProfileCard
            canUpdate={canUpdate}
            business={{
              name: business.name,
              email: business.email,
              phone: business.phone,
              address: business.address,
              description: business.description,
              timezone: business.timezone,
              currency: business.currency,
              status: business.status,
              categoryName: business.category.name,
              planName: business.subscription?.plan.name ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
