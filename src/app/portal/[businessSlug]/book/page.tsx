import { redirect } from "next/navigation";
import { getPortalSession } from "@/features/portal/actions";
import { prisma } from "@/server/db/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";

export const metadata = { title: "Book a Session" };

export default async function BookSessionPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await getPortalSession();
  
  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const { business, customer } = session;

  // Fetch available trainers (Staff profiles)
  const trainers = await prisma.staffProfile.findMany({
    where: { businessId: business.id, status: "ACTIVE" },
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/portal/${business.slug}/dashboard`}>&larr; Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <PageHeader 
          title="Book Personal Training" 
          description="Select a trainer and a time slot for your next 1-on-1 session." 
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {trainers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No trainers currently available for booking.
            </div>
          ) : (
            trainers.map((trainer) => (
              <Card key={trainer.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="w-5 h-5 text-primary" />
                    {trainer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {trainer.title || "Personal Trainer"}
                  </p>
                  
                  <form action={async () => {
                    "use server";
                    const tomorrow = addDays(new Date(), 1);
                    tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow
                    const endTime = new Date(tomorrow);
                    endTime.setHours(11, 0, 0, 0); // 1 Hour session

                    await prisma.booking.create({
                      data: {
                        businessId: business.id,
                        customerId: customer.id,
                        staffProfileId: trainer.id,
                        startAt: tomorrow,
                        endAt: endTime,
                        status: "CONFIRMED",
                        notes: "Self-booked via Portal"
                      }
                    });

                    redirect(`/portal/${business.slug}/dashboard`);
                  }}>
                    <Button type="submit" className="w-full">
                      Book Tomorrow 10:00 AM
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
