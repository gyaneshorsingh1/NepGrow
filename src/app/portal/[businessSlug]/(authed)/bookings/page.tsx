import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { getPortalSession } from "@/features/portal/actions";
import { formatMoney } from "@/lib/utils";
import { prisma } from "@/server/db/prisma";

export const metadata = { title: "My Bookings" };

export default async function PortalBookingsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await getPortalSession();
  if (!session || session.business.slug !== businessSlug) {
    redirect(`/portal/${businessSlug}`);
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.customer.id },
    include: {
      court: { include: { facility: true } },
      staffProfile: true,
    },
    orderBy: { startAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          My bookings
        </h1>
        <p className="text-sm text-muted-foreground">
          Courts and personal training sessions.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No bookings yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {b.court
                      ? `${b.court.facility.name} · ${b.court.name}`
                      : `PT · ${b.staffProfile?.name ?? "Trainer"}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(b.startAt, "MMM d, yyyy · h:mm a")} –{" "}
                    {format(b.endAt, "h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">
                    {b.status}
                  </p>
                  <p className="font-medium tabular-nums">
                    {formatMoney(b.totalCents, session.business.currency)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
