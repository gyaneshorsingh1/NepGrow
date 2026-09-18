import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/server/services/activity";
import type { TenantContext } from "@/lib/authorization/context";
import { authorize, requireModule } from "@/lib/authorization/context";

export async function listCustomers(ctx: TenantContext) {
  await requireModule(ctx, "customers");
  await authorize(ctx, "view", "customers", "customers");
  return prisma.customer.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(
  ctx: TenantContext,
  data: { name: string; email?: string; phone?: string; notes?: string },
) {
  await requireModule(ctx, "customers");
  await authorize(ctx, "create", "customers", "customers");
  const customer = await prisma.customer.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      notes: data.notes,
    },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "customer.created",
    module: "customers",
    entity: "Customer",
    entityId: customer.id,
  });
  return customer;
}

export async function listFacilities(ctx: TenantContext) {
  await requireModule(ctx, "facilities");
  await authorize(ctx, "view", "facilities", "facilities");
  return prisma.facility.findMany({
    where: { businessId: ctx.businessId },
    include: { courts: true },
    orderBy: { name: "asc" },
  });
}

export async function createFacility(
  ctx: TenantContext,
  data: { name: string; sport: string; description?: string },
) {
  await requireModule(ctx, "facilities");
  await authorize(ctx, "create", "facilities", "facilities");
  return prisma.facility.create({
    data: { businessId: ctx.businessId, ...data },
  });
}

export async function createCourt(
  ctx: TenantContext,
  data: {
    facilityId: string;
    name: string;
    capacity?: number;
    hourlyRateCents: number;
  },
) {
  await requireModule(ctx, "courts");
  await authorize(ctx, "create", "courts", "courts");
  const facility = await prisma.facility.findFirst({
    where: { id: data.facilityId, businessId: ctx.businessId },
  });
  if (!facility) throw new AppError("Facility not found", "NOT_FOUND", 404);
  return prisma.court.create({
    data: {
      businessId: ctx.businessId,
      facilityId: data.facilityId,
      name: data.name,
      capacity: data.capacity,
      hourlyRateCents: data.hourlyRateCents,
    },
  });
}

async function assertNoBookingConflict(
  courtId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
) {
  if (endAt <= startAt) {
    throw new AppError("End time must be after start time", "VALIDATION", 400);
  }
  const conflict = await prisma.booking.findFirst({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: excludeId ? { not: excludeId } : undefined,
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
  });
  if (conflict) {
    throw new AppError("Court is already booked for this time", "CONFLICT", 409);
  }
}

export async function createBooking(
  ctx: TenantContext,
  data: {
    courtId: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    startAt: string;
    endAt: string;
    notes?: string;
    totalCents?: number;
  },
) {
  await requireModule(ctx, "bookings");
  await authorize(ctx, "create", "bookings", "bookings");

  const court = await prisma.court.findFirst({
    where: { id: data.courtId, businessId: ctx.businessId },
  });
  if (!court) throw new AppError("Court not found", "NOT_FOUND", 404);

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  return prisma.$transaction(async (tx) => {
    const conflict = await tx.booking.findFirst({
      where: {
        courtId: data.courtId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
      },
    });
    if (conflict) {
      throw new AppError("Court is already booked for this time", "CONFLICT", 409);
    }

    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      const customer = await tx.customer.create({
        data: {
          businessId: ctx.businessId,
          name: data.customerName,
          email: data.customerEmail || null,
          phone: data.customerPhone,
        },
      });
      customerId = customer.id;
    }

    const booking = await tx.booking.create({
      data: {
        businessId: ctx.businessId,
        courtId: data.courtId,
        customerId: customerId ?? null,
        startAt,
        endAt,
        notes: data.notes,
        totalCents: data.totalCents ?? court.hourlyRateCents,
        status: "CONFIRMED",
      },
    });

    await logActivity({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "booking.created",
      module: "bookings",
      entity: "Booking",
      entityId: booking.id,
    });

    return booking;
  });
}

/** Public booking without tenant user context (website) */
export async function createPublicBooking(input: {
  businessId: string;
  courtId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  startAt: string;
  endAt: string;
  notes?: string;
}) {
  const business = await prisma.business.findFirst({
    where: { id: input.businessId, status: "ACTIVE" },
    include: {
      businessModules: { include: { module: true } },
    },
  });
  if (!business) throw new AppError("Business not found", "NOT_FOUND", 404);
  const hasBookings = business.businessModules.some(
    (m) => m.enabled && m.module.key === "bookings",
  );
  if (!hasBookings) {
    throw new AppError("Online booking is not available", "FORBIDDEN", 403);
  }

  const court = await prisma.court.findFirst({
    where: {
      id: input.courtId,
      businessId: input.businessId,
      status: "ACTIVE",
    },
  });
  if (!court) throw new AppError("Court not found", "NOT_FOUND", 404);

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  await assertNoBookingConflict(input.courtId, startAt, endAt);

  return prisma.$transaction(async (tx) => {
    const conflict = await tx.booking.findFirst({
      where: {
        courtId: input.courtId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
      },
    });
    if (conflict) {
      throw new AppError("Court is already booked for this time", "CONFLICT", 409);
    }

    const customer = await tx.customer.create({
      data: {
        businessId: input.businessId,
        name: input.customerName,
        email: input.customerEmail || null,
        phone: input.customerPhone,
      },
    });

    const booking = await tx.booking.create({
      data: {
        businessId: input.businessId,
        courtId: input.courtId,
        customerId: customer.id,
        startAt,
        endAt,
        notes: input.notes,
        totalCents: court.hourlyRateCents,
        status: "CONFIRMED",
      },
    });

    await tx.activityLog.create({
      data: {
        businessId: input.businessId,
        action: "booking.created.public",
        module: "bookings",
        entity: "Booking",
        entityId: booking.id,
        metadata: { source: "website" },
      },
    });

    return booking;
  });
}

export async function listBookings(ctx: TenantContext) {
  await requireModule(ctx, "bookings");
  await authorize(ctx, "view", "bookings", "bookings");
  return prisma.booking.findMany({
    where: { businessId: ctx.businessId },
    include: { court: { include: { facility: true } }, customer: true },
    orderBy: { startAt: "desc" },
    take: 100,
  });
}

export async function listPayments(ctx: TenantContext) {
  await requireModule(ctx, "payments");
  await authorize(ctx, "view", "payments", "payments");
  return prisma.payment.findMany({
    where: { businessId: ctx.businessId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createPayment(
  ctx: TenantContext,
  data: {
    amountCents: number;
    customerId?: string;
    bookingId?: string;
    method?: string;
    reference?: string;
    notes?: string;
  },
) {
  await requireModule(ctx, "payments");
  await authorize(ctx, "create", "payments", "payments");
  const payment = await prisma.payment.create({
    data: {
      businessId: ctx.businessId,
      amountCents: data.amountCents,
      customerId: data.customerId,
      bookingId: data.bookingId,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      status: "COMPLETED",
    },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "payment.created",
    module: "payments",
    entity: "Payment",
    entityId: payment.id,
  });
  return payment;
}

export async function createMembershipProduct(
  ctx: TenantContext,
  data: {
    name: string;
    description?: string;
    priceCents: number;
    durationDays: number;
  },
) {
  await requireModule(ctx, "memberships");
  await authorize(ctx, "create", "memberships", "memberships");
  return prisma.membershipProduct.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      description: data.description,
      priceCents: data.priceCents,
      durationDays: data.durationDays,
    },
  });
}

export async function listStaff(ctx: TenantContext) {
  await requireModule(ctx, "staff");
  await authorize(ctx, "view", "staff", "staff");
  return prisma.staffProfile.findMany({
    where: { businessId: ctx.businessId },
    orderBy: { name: "asc" },
  });
}

export async function createStaff(
  ctx: TenantContext,
  data: { name: string; email?: string; phone?: string; title?: string },
) {
  await requireModule(ctx, "staff");
  await authorize(ctx, "create", "staff", "staff");
  return prisma.staffProfile.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      title: data.title,
    },
  });
}

export async function getSportsReport(ctx: TenantContext) {
  await requireModule(ctx, "reports");
  await authorize(ctx, "view", "reports", "reports");
  const [customers, bookings, payments, revenue] = await Promise.all([
    prisma.customer.count({ where: { businessId: ctx.businessId } }),
    prisma.booking.count({
      where: { businessId: ctx.businessId, status: { not: "CANCELLED" } },
    }),
    prisma.payment.count({
      where: { businessId: ctx.businessId, status: "COMPLETED" },
    }),
    prisma.payment.aggregate({
      where: { businessId: ctx.businessId, status: "COMPLETED" },
      _sum: { amountCents: true },
    }),
  ]);
  return {
    customers,
    bookings,
    payments,
    revenueCents: revenue._sum.amountCents ?? 0,
  };
}
