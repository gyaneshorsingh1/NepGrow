import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const customerId = searchParams.get("customerId");
    const facilityId = searchParams.get("facilityId"); // Optional: for specific turnstile

    if (!businessId || !customerId) {
      return NextResponse.json(
        { allowed: false, reason: "Missing businessId or customerId" },
        { status: 400 }
      );
    }

    // 1. Check if customer exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.businessId !== businessId || customer.status !== "ACTIVE") {
      await logAccess(businessId, customerId, facilityId, false, "Customer not found or inactive");
      return NextResponse.json({ allowed: false, reason: "Customer not active" });
    }

    // 2. Check for overdue payments
    const overduePayment = await prisma.payment.findFirst({
      where: {
        businessId,
        customerId,
        status: "PENDING",
        createdAt: { lt: new Date() }, // Overdue if pending and past creation date
      },
    });

    if (overduePayment) {
      await logAccess(businessId, customerId, facilityId, false, "Overdue payments");
      return NextResponse.json({ allowed: false, reason: "Overdue payments" });
    }

    // 3. Check for active membership
    const activeMembership = await prisma.membership.findFirst({
      where: {
        businessId,
        customerId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    if (!activeMembership) {
      await logAccess(businessId, customerId, facilityId, false, "No active membership");
      return NextResponse.json({ allowed: false, reason: "No active membership" });
    }

    // If all checks pass, allow entry
    await logAccess(businessId, customerId, facilityId, true, "Granted");
    return NextResponse.json({ allowed: true, reason: "Access granted" });

  } catch (error) {
    console.error("Access Control API error", error);
    return NextResponse.json({ allowed: false, reason: "Internal Server Error" }, { status: 500 });
  }
}

async function logAccess(
  businessId: string, 
  customerId: string, 
  facilityId: string | null, 
  granted: boolean, 
  reason: string
) {
  try {
    await prisma.accessLog.create({
      data: {
        businessId,
        customerId,
        facilityId,
        granted,
        reason,
      },
    });
  } catch (e) {
    // Silently fail logging rather than blocking the hardware response
    console.error("Failed to log access", e);
  }
}
