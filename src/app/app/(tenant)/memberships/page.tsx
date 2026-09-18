import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateMembershipProductForm } from "@/app/app/(tenant)/memberships/create-membership-form";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Memberships" };

export default async function MembershipsPage() {
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");

  const [products, memberships] = await Promise.all([
    prisma.membershipProduct.findMany({
      where: { businessId: ctx.businessId },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { businessId: ctx.businessId },
      include: { customer: true, product: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const canCreate =
    ctx.ability.can("create", "memberships") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Memberships"
        description="Membership products and active members."
      />

      {canCreate ? <CreateMembershipProductForm /> : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Products</h2>
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{formatMoney(p.priceCents)}</TableCell>
                  <TableCell>{p.durationDays} days</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Members</h2>
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.customer.name}</TableCell>
                  <TableCell>{m.product.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
