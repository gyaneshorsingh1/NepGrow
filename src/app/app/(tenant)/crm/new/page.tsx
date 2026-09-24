import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { CreateLeadForm } from "./create-lead-form";

export const metadata = { title: "Add Lead" };

export default async function AddLeadPage() {
  const ctx = await resolveTenantContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Lead"
        description="Enter the details of a new prospect."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateLeadForm businessId={ctx.businessId} />
      </div>
    </div>
  );
}
