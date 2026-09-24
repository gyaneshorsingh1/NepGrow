import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { AssignProgramForm } from "./assign-program-form";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "Assign Custom Program" };

export default async function AssignProgramPage() {
  const ctx = await resolveTenantContext();

  const customers = await prisma.customer.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Assign Custom Program"
        description="Assign a structured program to a customer."
      />
      <div className="bg-white rounded-xl border border-border p-6">
        <AssignProgramForm businessId={ctx.businessId} customers={customers} />
      </div>
    </div>
  );
}
