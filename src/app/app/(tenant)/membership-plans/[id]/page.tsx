import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ClickableTableRow,
  RowActionsCell,
} from "@/components/shared/clickable-table-row";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  authorize,
  requireModule,
  resolveTenantContext,
} from "@/lib/authorization/context";
import { AppError } from "@/lib/errors";
import { formatTenantMoney } from "@/lib/utils";
import { getMembershipProduct } from "@/server/services/memberships";

export const metadata = { title: "Plan details" };

export default async function MembershipPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await resolveTenantContext();
  await requireModule(ctx, "memberships");

  let product;
  try {
    await authorize(ctx, "view", "memberships", "memberships");
    product = await getMembershipProduct(ctx, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description="Membership plan details."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/membership-plans">Back to plans</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={product.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-medium">
              {formatTenantMoney(product.priceCents, ctx)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">{product.durationDays} days</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-medium">
              {product.activeCount} active · {product._count.memberships} total
            </p>
          </div>
          {product.description ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{product.description}</p>
            </div>
          ) : null}
          {product.benefits.length > 0 ? (
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs text-muted-foreground">Benefits</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {product.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Enrolled customers</h2>
        {product.memberships.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            description="Assign this plan to a customer from Memberships."
          />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.memberships.map((m) => (
                  <ClickableTableRow
                    key={m.id}
                    href={`/app/memberships/${m.id}`}
                  >
                    <TableCell>
                      <div className="font-medium">{m.customer.name}</div>
                      {m.customer.email ? (
                        <div className="text-xs text-muted-foreground">
                          {m.customer.email}
                        </div>
                      ) : null}
                      {m.customer.phone ? (
                        <div className="text-xs text-muted-foreground">
                          {m.customer.phone}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {m.startDate.toISOString().slice(0, 10)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {m.endDate.toISOString().slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {formatTenantMoney(m.priceCents, ctx)}
                    </TableCell>
                    <TableCell>
                      {m.payment
                        ? `${formatTenantMoney(m.payment.amountCents, {
                            currency: m.payment.currency || ctx.currency,
                            currencyDecimals: ctx.currencyDecimals,
                          })} (${m.payment.status})`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <RowActionsCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/app/memberships/${m.id}`}>View</Link>
                      </Button>
                    </RowActionsCell>
                  </ClickableTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
