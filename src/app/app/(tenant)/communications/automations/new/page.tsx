import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { CreateRuleForm } from "./create-rule-form";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "New Automation Rule" };

export default async function NewAutomationRulePage() {
  const ctx = await resolveTenantContext();

  const templates = await prisma.documentTemplate.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-3xl flex flex-col">
      <PageHeader
        title="New Automation Rule"
        description="Configure a trigger to dispatch a template."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateRuleForm businessId={ctx.businessId} templates={templates} />
      </div>
    </div>
  );
}
