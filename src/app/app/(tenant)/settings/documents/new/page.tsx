import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { CreateTemplateForm } from "./create-template-form";

export const metadata = { title: "New Document Template" };

export default async function NewDocumentPage() {
  const ctx = await resolveTenantContext();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="New Document Template"
        description="Create a new waiver, contract, or agreement for your customers to sign."
      />
      <div className="bg-white rounded-xl border border-border p-6">
        <CreateTemplateForm businessId={ctx.businessId} />
      </div>
    </div>
  );
}
