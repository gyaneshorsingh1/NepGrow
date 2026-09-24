import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getPortalSession, logoutPortalCustomerAction } from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Calendar, UserCircle, LogOut, Activity, AlertTriangle, CreditCard } from "lucide-react";
import { SignatureGateway } from "./signature-gateway";
import { LogMetricWidget } from "./log-metric-widget";

export const metadata = { title: "My Dashboard" };

export default async function PortalDashboardPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await getPortalSession();
  
  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const { customer, business } = session;

  // Fetch active memberships
  const memberships = await prisma.membership.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
    include: { product: true },
  });

  // Fetch required templates that haven't been signed
  const requiredTemplates = await prisma.documentTemplate.findMany({
    where: { businessId: business.id, isRequired: true, status: "ACTIVE" },
  });
  
  const signedDocs = await prisma.customerDocument.findMany({
    where: { customerId: customer.id, status: "SIGNED" },
    select: { templateId: true },
  });
  
  const signedTemplateIds = new Set(signedDocs.map(d => d.templateId));
  const pendingTemplate = requiredTemplates.find(t => !signedTemplateIds.has(t.id));

  // Fetch upcoming bookings
  const bookings = await prisma.booking.findMany({
    where: { 
      customerId: customer.id,
      startAt: { gte: new Date() }
    },
    include: { court: { include: { facility: true } }, staffProfile: true },
    orderBy: { startAt: 'asc' },
    take: 5
  });

  // Fetch active programs
  const programs = await prisma.customProgram.findMany({
    where: { customerId: customer.id, status: "ACTIVE" },
  });

  // Fetch pending invoices
  const pendingPayments = await prisma.payment.findMany({
    where: { customerId: customer.id, status: "PENDING" },
    include: { membership: { include: { product: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {pendingTemplate && (
        <SignatureGateway 
          businessId={business.id} 
          customerId={customer.id} 
          template={pendingTemplate} 
        />
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="font-bold text-primary">{business.name.charAt(0)}</span>
            </div>
            <span className="font-semibold">{business.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">Hi, {customer.name}</span>
            <form action={logoutPortalCustomerAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {pendingPayments.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Action Required: Pending Invoices</h3>
                <p className="text-sm text-orange-800 mt-1">
                  You have {pendingPayments.length} pending payment(s) for your membership renewals. Please settle them to avoid service interruption.
                </p>
              </div>
            </div>
            <form action={async () => {
              "use server";
              // Simulated checkout action
              const p = pendingPayments[0];
              await prisma.payment.update({ where: { id: p.id }, data: { status: "COMPLETED" } });
              redirect(`/portal/${business.slug}/dashboard`);
            }}>
              <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                <CreditCard className="w-4 h-4 mr-2" /> Pay {pendingPayments[0].currency} {pendingPayments[0].amountCents}
              </Button>
            </form>
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Active Memberships */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" /> My Memberships
            </h2>
            {memberships.length === 0 ? (
              <Card className="bg-white border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  You don&apos;t have any active memberships right now.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {memberships.map(m => (
                  <Card key={m.id} className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{m.product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valid until:</span>
                          <span className="font-medium">{format(m.endDate, "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-primary/10">
                          <span className="text-muted-foreground">Status:</span>
                          <StatusBadge status={m.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* My Programs */}
            <h2 className="text-xl font-semibold flex items-center gap-2 mt-12">
              <Activity className="w-5 h-5 text-primary" /> My Programs
            </h2>
            {programs.length === 0 ? (
              <Card className="bg-white border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  You don&apos;t have any active custom programs.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {programs.map(p => (
                  <Card key={p.id} className="border-border bg-white">
                    <CardHeader className="pb-2 bg-slate-50 border-b">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <pre className="text-sm font-sans whitespace-pre-wrap text-muted-foreground line-clamp-4">
                        {String(p.content)}
                      </pre>
                      <Button variant="link" className="px-0 mt-2">View Full Program</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Upcoming Bookings
              </h2>
              <Button asChild size="sm" variant="outline">
                <Link href={`/portal/${business.slug}/book`}>Book PT</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No upcoming bookings.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {bookings.map(b => (
                      <div key={b.id} className="p-4 flex gap-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-md p-2 min-w-[3.5rem]">
                          <span className="text-xs font-bold uppercase">{format(b.startAt, "MMM")}</span>
                          <span className="text-lg font-black leading-none">{format(b.startAt, "d")}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {b.court ? `${b.court.facility.name} - ${b.court.name}` : `PT Session w/ ${b.staffProfile?.name ?? "Trainer"}`}
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

            <LogMetricWidget customerId={customer.id} />
          </div>
        </div>

      </main>
    </div>
  );
}
