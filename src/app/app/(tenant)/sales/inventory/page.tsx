import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveTenantContext } from "@/lib/authorization/context";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "Inventory Management" };

export default async function InventoryPage() {
  const ctx = await resolveTenantContext();

  const products = await prisma.product.findMany({
    where: { businessId: ctx.businessId, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage your products, stock levels, and pricing."
        actions={
          <Button asChild>
            <Link href="/app/sales/inventory/new">+ Add Product</Link>
          </Button>
        }
      />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No products in inventory. Start by adding some!
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku || "—"}</TableCell>
                <TableCell className="text-right">
                  {(product.priceCents / 100).toLocaleString(undefined, {
                    style: "currency",
                    currency: "NPR", // Ideally fetched from business settings
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <span className={product.stockLevel < 5 ? "text-destructive font-medium" : ""}>
                    {product.stockLevel}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
