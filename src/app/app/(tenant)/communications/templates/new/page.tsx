import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { CreateTemplateForm } from "./create-template-form";

export const metadata = { title: "Create Template" };

export default async function CreateTemplatePage() {
  const ctx = await resolveTenantContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Template"
        description="Write a new message template to be used in your automations or manual broadcasts."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateTemplateForm businessId={ctx.businessId} />
      </div>
    </div>
  );
}
