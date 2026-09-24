import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { addDays } from "date-fns";

export async function GET() {
  // In a real app, verify a secret cron header here
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

  try {
    const today = new Date();
    // Find memberships that expire in exactly 3 days and don't have a pending payment yet
    const expiringSoon = await prisma.membership.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: addDays(today, 2),
          lte: addDays(today, 3), // Expiring in ~3 days
        },
      },
      include: {
        product: true,
        business: true,
        customer: true,
      },
    });

    let invoicesCreated = 0;

    for (const membership of expiringSoon) {
      // Check if a pending payment already exists for this membership
      const existingInvoice = await prisma.payment.findFirst({
        where: {
          membershipId: membership.id,
          status: "PENDING",
        },
      });

      if (!existingInvoice) {
        // Create an invoice (Pending Payment)
        await prisma.payment.create({
          data: {
            businessId: membership.businessId,
            customerId: membership.customerId,
            membershipId: membership.id,
            amountCents: membership.priceCents > 0 ? membership.priceCents : membership.product.priceCents,
            currency: membership.business.currency,
            status: "PENDING",
            notes: `Auto-generated invoice for ${membership.product.name} renewal`,
          },
        });
        
        invoicesCreated++;

        // Trigger Automation Rule if configured (e.g. INVOICE_GENERATED)
        // For MVP, we just create the pending payment to show on the Portal.
      }
    }

    return NextResponse.json({
      success: true,
      message: `Billing cron executed. Generated ${invoicesCreated} invoices.`,
    });
  } catch (error) {
    console.error("Billing cron failed", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
