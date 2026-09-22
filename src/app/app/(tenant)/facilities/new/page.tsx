import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";

import { CreateFacilityForm } from "../create-facility-form";

export const metadata = { title: "New facility" };

export default async function NewFacilityPage() {
  const ctx = await resolveTenantContext();
  try {
    await authorize(ctx, "create", "facilities");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need facilities.create to add facilities." />
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add facility"
        description="Create a sports facility available at your center."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateFacilityForm />
        </CardContent>
      </Card>
    </div>
  );
}
