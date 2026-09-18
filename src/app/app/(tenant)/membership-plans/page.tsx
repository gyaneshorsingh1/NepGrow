import Link from "next/link";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClickableTableRow,
  RowActionsCell,
} from "@/components/shared/clickable-table-row";
import { ProductRowActions } from "@/app/app/(tenant)/memberships/product-row-actions";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { formatTenantMoney } from "@/lib/utils";
import { listMembershipProducts } from "@/server/services/memberships";

export const metadata = { title: "Plans" };

function benefitsFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function MembershipPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");
  await authorize(ctx, "view", "memberships", "memberships");

  const planStatus =
    status === "ACTIVE" || status === "INACTIVE" ? status : undefined;

  const products = await listMembershipProducts(ctx, {
    search: q?.trim() || undefined,
    status: planStatus,
  });

  const canCreate =
    ctx.ability.can("create", "memberships") || ctx.isPlatformAdmin;
  const canUpdate =
    ctx.ability.can("update", "memberships") || ctx.isPlatformAdmin;
  const canDelete =
    ctx.ability.can("delete", "memberships") || ctx.isPlatformAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Membership plans and subscriptions you can assign to customers."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/memberships">Memberships</Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/app/membership-plans/new">+ Create Plan</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            name="q"
            placeholder="Search plans…"
            defaultValue={q ?? ""}
            className="sm:w-48"
          />
          <Select name="status" defaultValue={planStatus ?? ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No membership plans"
          description="Create a plan to start assigning memberships to customers."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Active members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <ClickableTableRow
                  key={p.id}
                  href={`/app/membership-plans/${p.id}`}
                >
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.description ? (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {p.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatTenantMoney(p.priceCents, ctx)}</TableCell>
                  <TableCell>{p.durationDays} days</TableCell>
                  <TableCell>{p.memberships.length}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <RowActionsCell>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" title="View">
                        <Link href={`/app/membership-plans/${p.id}`}>
                          <Eye aria-hidden />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <ProductRowActions
                        product={{
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          priceCents: p.priceCents,
                          durationDays: p.durationDays,
                          status: p.status,
                          benefits: benefitsFromJson(p.benefits),
                          activeCount: p.memberships.length,
                          historyCount: p._count.memberships,
                        }}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        currency={ctx.currency}
                        currencyDecimals={ctx.currencyDecimals}
                      />
                    </div>
                  </RowActionsCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
