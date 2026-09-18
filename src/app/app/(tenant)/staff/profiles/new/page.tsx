import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";

import { CreateStaffForm } from "../../create-staff-form";

export const metadata = { title: "New staff profile" };

export default async function NewStaffProfilePage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "staff");
  try {
    await authorize(ctx, "create", "staff", "staff");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need staff.create to add staff profiles." />
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add staff profile"
        description="Create an operational staff profile (not an app login)."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateStaffForm />
        </CardContent>
      </Card>
    </div>
  );
}
