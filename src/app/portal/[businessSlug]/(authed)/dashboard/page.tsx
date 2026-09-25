import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  UserCircle,
  Activity,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortalSession } from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";

import { LogMetricWidget } from "./log-metric-widget";
import { SignatureGateway } from "./signature-gateway";

export const metadata = { title: "My Dashboard" };

export default async function PortalDashboardPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();

  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const { customer, business } = session;

  const memberships = await prisma.membership.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
    include: { product: true },
  });

  const requiredTemplates = await prisma.documentTemplate.findMany({
    where: { businessId: business.id, isRequired: true, status: "ACTIVE" },
  });

  const signedDocs = await prisma.customerDocument.findMany({
    where: { customerId: customer.id, status: "SIGNED" },
    select: { templateId: true },
  });

  const signedTemplateIds = new Set(signedDocs.map((d) => d.templateId));
  const pendingTemplate = requiredTemplates.find(
    (t) => !signedTemplateIds.has(t.id),
  );

  const bookings = await prisma.booking.findMany({
    where: {
      customerId: customer.id,
      startAt: { gte: new Date() },
    },
    include: { court: { include: { facility: true } }, staffProfile: true },
    orderBy: { startAt: "asc" },
    take: 5,
  });

  const programs = await prisma.customProgram.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
  });

  const pendingPayments = await prisma.payment.findMany({
    where: { customerId: customer.id, status: "PENDING" },
    include: { membership: { include: { product: true } } },
  });

  return (
    <>
      {pendingTemplate && (
        <SignatureGateway
          businessId={business.id}
          customerId={customer.id}
          template={pendingTemplate}
        />
      )}

      <div className="space-y-6 sm:space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Hi, {customer.name}
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your dashboard
            </h1>
          </div>

          {pendingPayments.length > 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-amber-400/25 dark:bg-amber-400/10">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div className="min-w-0 space-y-1">
                  <h3 className="font-medium text-amber-950 dark:text-amber-100">
                    Action required: pending invoices
                  </h3>
                  <p className="text-sm text-amber-900/80 dark:text-amber-100/75">
                    You have {pendingPayments.length} pending payment(s). Settle
                    them to avoid service interruption.
                  </p>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  const p = pendingPayments[0];
                  await prisma.payment.update({
                    where: { id: p.id },
                    data: { status: "COMPLETED" },
                  });
                  redirect(`/portal/${business.slug}/dashboard`);
                }}
              >
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 w-full shrink-0 bg-amber-600 text-white hover:bg-amber-700 sm:w-auto dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-amber-950"
                >
                  <CreditCard className="size-4" />
                  Pay {pendingPayments[0].currency}{" "}
                  {pendingPayments[0].amountCents}
                </Button>
              </form>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-8 lg:col-span-2">
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                  <UserCircle className="size-5 text-primary" />
                  My Memberships
                </h2>
                {memberships.length === 0 ? (
                  <Card className="border-dashed bg-card/60">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground sm:p-8">
                      You don&apos;t have any active memberships right now.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {memberships.map((m) => (
                      <Card
                        key={m.id}
                        className="border-primary/20 bg-primary/5 dark:bg-primary/10"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base sm:text-lg">
                            {m.product.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">
                                Valid until
                              </span>
                              <span className="font-medium">
                                {format(m.endDate, "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-3 border-t border-primary/10 pt-2">
                              <span className="text-muted-foreground">
                                Status
                              </span>
                              <StatusBadge status={m.status} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                  <Activity className="size-5 text-primary" />
                  My Programs
                </h2>
                {programs.length === 0 ? (
                  <Card className="border-dashed bg-card/60">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground sm:p-8">
                      You don&apos;t have any active custom programs.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {programs.map((p) => (
                      <Card key={p.id} className="overflow-hidden bg-card">
                        <CardHeader className="border-b border-border bg-muted/40 pb-3">
                          <CardTitle className="text-base sm:text-lg">
                            {p.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <pre className="line-clamp-4 whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                            {String(p.content)}
                          </pre>
                          <Button variant="link" className="mt-2 h-auto px-0">
                            View Full Program
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6 lg:space-y-5">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                    <Calendar className="size-5 text-primary" />
                    Upcoming
                  </h2>
                  <Button asChild size="sm" variant="outline" className="h-9">
                    <Link href={`/portal/${business.slug}/book`}>Book PT</Link>
                  </Button>
                </div>
                <Card className="bg-card">
                  <CardContent className="p-0">
                    {bookings.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No upcoming bookings.
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {bookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:p-4"
                          >
                            <div className="flex min-w-14 flex-col items-center justify-center rounded-lg bg-primary/10 p-2 text-primary">
                              <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                                {format(b.startAt, "MMM")}
                              </span>
                              <span className="text-lg font-black leading-none sm:text-xl">
                                {format(b.startAt, "d")}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {b.court
                                  ? `${b.court.facility.name} - ${b.court.name}`
                                  : `PT Session w/ ${b.staffProfile?.name ?? "Trainer"}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(b.startAt, "h:mm a")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              <LogMetricWidget customerId={customer.id} />
            </aside>
          </div>
        </div>
    </>
  );
}
