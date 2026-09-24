"use server";

import { startOfDay, endOfDay, startOfMonth, addDays } from "date-fns";
import { prisma } from "@/server/db/prisma";

export async function getDashboardStats(businessId: string) {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const startOfCurrentMonth = startOfMonth(today);
  const nextWeek = addDays(today, 7);

  // 1. Active Memberships
  const activeMembers = await prisma.membership.count({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: { gte: today },
    },
  });

  // 2. Check-ins Today
  const checkInsToday = await prisma.checkIn.count({
    where: {
      businessId,
      checkInAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  // 3. Currently Inside (Checked in, but not checked out)
  const currentlyInside = await prisma.checkIn.count({
    where: {
      businessId,
      checkInAt: {
        gte: startOfToday,
      },
      checkOutAt: null,
    },
  });

  // 4. Memberships Expiring This Week
  const expiringThisWeek = await prisma.membership.count({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: {
        gte: today,
        lte: nextWeek,
      },
    },
  });

  // 5. Overdue Payments (Pending status on bookings/memberships)
  const overduePayments = await prisma.payment.count({
    where: {
      businessId,
      status: "PENDING",
      createdAt: { lt: today }, // Any pending payment created before today
    },
  });

  // 6. Revenue This Month
  const revenueTxns = await prisma.accountingTransaction.aggregate({
    where: {
      businessId,
      type: "INCOME",
      occurredAt: { gte: startOfCurrentMonth },
    },
    _sum: {
      amountCents: true,
    },
  });
  const revenueThisMonthCents = revenueTxns._sum.amountCents || 0;

  // 7. New Leads (Pending / New status)
  const newLeads = await prisma.lead.count({
    where: {
      businessId,
      status: "NEW",
    },
  });

  // 8. Alerts data
  const expiringMembershipsList = await prisma.membership.findMany({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: { gte: today, lte: nextWeek },
    },
    include: { customer: true },
    take: 5,
  });

  const overduePaymentsList = await prisma.payment.findMany({
    where: {
      businessId,
      status: "PENDING",
      createdAt: { lt: today },
    },
    include: { customer: true },
    take: 5,
  });

  return {
    activeMembers,
    checkInsToday,
    currentlyInside,
    expiringThisWeek,
    overduePayments,
    revenueThisMonthCents,
    newLeads,
    alerts: {
      expiringMemberships: expiringMembershipsList,
      overduePayments: overduePaymentsList,
    },
  };
}
