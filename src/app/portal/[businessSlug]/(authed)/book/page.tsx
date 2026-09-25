import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPortalSession } from "@/features/portal/actions";
import { formatMoney } from "@/lib/utils";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "Book PT" };

export default async function BookSessionPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();

  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const { business, customer } = session;

  const trainers = await prisma.staffProfile.findMany({
    where: { businessId: business.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Book Personal Training
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
          Select a trainer for a 1-hour session tomorrow at 10:00 AM. Trainer
          charges are shown before you book.
        </p>
      </div>

      {trainers.length === 0 ? (
        <Card className="border-dashed bg-card/60">
          <CardContent className="p-8 text-center text-sm text-muted-foreground sm:p-12">
            No trainers currently available for booking.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">
          {trainers.map((trainer) => {
            const totalCents = trainer.hourlyRateCents;

            return (
              <Card key={trainer.id} className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCheck className="size-4" />
                    </span>
                    <span className="truncate">{trainer.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {trainer.title || "Personal Trainer"}
                    {" · "}
                    {formatMoney(trainer.hourlyRateCents, business.currency)}
                    /hr
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium tabular-nums">
                    Session total: {formatMoney(totalCents, business.currency)}
                  </p>
                  <form
                    action={async () => {
                      "use server";
                      const fresh = await prisma.staffProfile.findFirst({
                        where: {
                          id: trainer.id,
                          businessId: business.id,
                          status: "ACTIVE",
                        },
                      });
                      if (!fresh) {
                        redirect(`/portal/${business.slug}/book`);
                      }

                      const tomorrow = addDays(new Date(), 1);
                      tomorrow.setHours(10, 0, 0, 0);
                      const endTime = new Date(tomorrow);
                      endTime.setHours(11, 0, 0, 0);
                      const hours =
                        (endTime.getTime() - tomorrow.getTime()) /
                        (1000 * 60 * 60);
                      const charge = fresh.hourlyRateCents * hours;

                      const conflict = await prisma.booking.findFirst({
                        where: {
                          staffProfileId: fresh.id,
                          status: { in: ["PENDING", "CONFIRMED"] },
                          AND: [
                            { startAt: { lt: endTime } },
                            { endAt: { gt: tomorrow } },
                          ],
                        },
                      });
                      if (conflict) {
                        redirect(
                          `/portal/${business.slug}/book?error=unavailable`,
                        );
                      }

                      await prisma.booking.create({
                        data: {
                          businessId: business.id,
                          customerId: customer.id,
                          staffProfileId: fresh.id,
                          startAt: tomorrow,
                          endAt: endTime,
                          status: "CONFIRMED",
                          notes: "Self-booked via Portal",
                          totalCents: charge,
                        },
                      });

                      redirect(`/portal/${business.slug}/bookings`);
                    }}
                  >
                    <Button type="submit" className="h-11 w-full text-sm sm:h-10">
                      Book Tomorrow 10:00 AM
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
