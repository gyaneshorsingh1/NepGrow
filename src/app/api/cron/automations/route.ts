import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  // In production, you would secure this endpoint with a cron secret key
  
  try {
    const rules = await prisma.automationRule.findMany({
      where: { status: "ACTIVE" },
      include: { template: true },
    });

    let processedCount = 0;

    for (const rule of rules) {
      // 1. "Membership Expiring" logic simulation
      if (rule.triggerEvent === "MEMBERSHIP_EXPIRING") {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3); // Hardcoded 3 days for MVP

        const expiringMemberships = await prisma.membership.findMany({
          where: {
            businessId: rule.businessId,
            status: "ACTIVE",
            endDate: {
              gte: new Date(),
              lte: targetDate,
            },
          },
          include: { customer: true },
        });

        for (const membership of expiringMemberships) {
          // Check if we already sent this recently to avoid spam
          const recentLog = await prisma.notificationLog.findFirst({
            where: {
              businessId: rule.businessId,
              customerId: membership.customer.id,
              subject: rule.template.subject,
              sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          });

          if (!recentLog && membership.customer.email) {
            // "Send" email by logging it
            await prisma.notificationLog.create({
              data: {
                businessId: rule.businessId,
                customerId: membership.customer.id,
                type: rule.template.type,
                recipient: membership.customer.email,
                subject: rule.template.subject || "Important Notice",
                body: rule.template.body.replace("{{name}}", membership.customer.name),
                status: "SENT",
              },
            });
            processedCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error) {
    console.error("Automations cron error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
