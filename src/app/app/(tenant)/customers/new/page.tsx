import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { authorize, resolveTenantContext } from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";

import { CreateCustomerForm } from "../create-customer-form";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  const ctx = await resolveTenantContext();
  try {
    await authorize(ctx, "create", "customers");
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") {
      return (
        <AccessDenied description="You need customers.create to add customers." />
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add customer"
        description="Create a customer who can book and hold memberships."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateCustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
