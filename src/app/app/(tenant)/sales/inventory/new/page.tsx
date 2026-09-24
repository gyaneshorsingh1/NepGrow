import { PageHeader } from "@/components/shared/page-header";
import { resolveTenantContext } from "@/lib/authorization/context";
import { CreateProductForm } from "./create-product-form";

export const metadata = { title: "Add Product" };

export default async function AddProductPage() {
  const ctx = await resolveTenantContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Product"
        description="Add a new physical product or service to your inventory."
      />
      <div className="rounded-xl border border-border bg-card p-6">
        <CreateProductForm businessId={ctx.businessId} />
      </div>
    </div>
  );
}
