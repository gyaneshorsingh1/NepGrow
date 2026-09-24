import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";
import { PosTerminal } from "./pos-terminal";

export const metadata = { title: "Point of Sale" };

export default async function POSPage() {
  const ctx = await resolveTenantContext();

  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    select: { id: true, name: true, priceCents: true, stockLevel: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Point of Sale"
        description="Quick checkout terminal for walk-in sales."
      />
      <PosTerminal businessId={ctx.businessId} products={products} />
    </div>
  );
}
