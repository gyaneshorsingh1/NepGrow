import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { CreateCheckInForm } from "./create-check-in-form";

export const metadata = { title: "Check In" };

export default async function CheckInPage() {
  const ctx = await resolveTenantContext();

  const [customers, facilities] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.facility.findMany({
      where: { businessId: ctx.businessId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check In"
        description="Record a customer's visit to the facility."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateCheckInForm
          businessId={ctx.businessId}
          customers={customers}
          facilities={facilities}
        />
      </div>
    </div>
  );
}
