import { auth } from "@/lib/auth/auth";
import { hashPassword } from "@/lib/crypto/password";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/server/services/activity";
import type { TenantContext } from "@/lib/authorization/context";
import { authorize, requireModule } from "@/lib/authorization/context";
import { assertCanAssignRoles } from "@/lib/authorization/guards";
import { createPaymentGateway } from "@/server/services/payment-gateway";
import {
  postCashbookPayment,
  reverseCashbookPayment,
} from "@/server/services/accounting";

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
  data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    password?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "customers");
  await authorize(ctx, "create", "customers", "customers");

  const email = data.email?.trim().toLowerCase() || null;
  const password = data.password?.trim();
  if (password && !email) {
    throw new AppError(
      "Email is required when setting a portal password",
      "VALIDATION",
      400,
    );
  }

  const customer = await prisma.customer.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      email,
      phone: data.phone,
      notes: data.notes,
      passwordHash: password ? hashPassword(password) : null,
      status: data.status ?? "ACTIVE",
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

export async function updateCustomer(
  ctx: TenantContext,
  customerId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    password?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "customers");
  await authorize(ctx, "update", "customers", "customers");
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Customer not found", "NOT_FOUND", 404);

  const email = data.email?.trim().toLowerCase() || null;
  const password = data.password?.trim();
  if (password && !email && !existing.email) {
    throw new AppError(
      "Email is required when setting a portal password",
      "VALIDATION",
      400,
    );
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: data.name,
      email,
      phone: data.phone,
      notes: data.notes,
      ...(data.status ? { status: data.status } : {}),
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "customer.updated",
    module: "customers",
    entity: "Customer",
    entityId: customer.id,
  });
  return customer;
}

export async function deleteCustomer(ctx: TenantContext, customerId: string) {
  await requireModule(ctx, "customers");
  await authorize(ctx, "delete", "customers", "customers");
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Customer not found", "NOT_FOUND", 404);

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { status: "INACTIVE" },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "customer.deleted",
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
  data: {
    name: string;
    sport: string;
    description?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "facilities");
  await authorize(ctx, "create", "facilities", "facilities");
  return prisma.facility.create({
    data: {
      businessId: ctx.businessId,
      name: data.name,
      sport: data.sport,
      description: data.description,
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function updateFacility(
  ctx: TenantContext,
  facilityId: string,
  data: {
    name: string;
    sport: string;
    description?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "facilities");
  await authorize(ctx, "update", "facilities", "facilities");
  const existing = await prisma.facility.findFirst({
    where: { id: facilityId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Facility not found", "NOT_FOUND", 404);

  const facility = await prisma.facility.update({
    where: { id: facilityId },
    data: {
      name: data.name,
      sport: data.sport,
      description: data.description,
      ...(data.status ? { status: data.status } : {}),
    },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "facility.updated",
    module: "facilities",
    entity: "Facility",
    entityId: facility.id,
  });
  return facility;
}

export async function deleteFacility(ctx: TenantContext, facilityId: string) {
  await requireModule(ctx, "facilities");
  await authorize(ctx, "delete", "facilities", "facilities");
  const existing = await prisma.facility.findFirst({
    where: { id: facilityId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Facility not found", "NOT_FOUND", 404);

  const facility = await prisma.facility.update({
    where: { id: facilityId },
    data: { status: "INACTIVE" },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "facility.deleted",
    module: "facilities",
    entity: "Facility",
    entityId: facility.id,
  });
  return facility;
}

export async function createCourt(
  ctx: TenantContext,
  data: {
    facilityId: string;
    name: string;
    capacity?: number;
    hourlyRateCents: number;
    status?: "ACTIVE" | "INACTIVE";
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
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function updateCourt(
  ctx: TenantContext,
  courtId: string,
  data: {
    facilityId: string;
    name: string;
    capacity?: number;
    hourlyRateCents: number;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "courts");
  await authorize(ctx, "update", "courts", "courts");
  const existing = await prisma.court.findFirst({
    where: { id: courtId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Court not found", "NOT_FOUND", 404);

  const facility = await prisma.facility.findFirst({
    where: { id: data.facilityId, businessId: ctx.businessId },
  });
  if (!facility) throw new AppError("Facility not found", "NOT_FOUND", 404);

  const court = await prisma.court.update({
    where: { id: courtId },
    data: {
      facilityId: data.facilityId,
      name: data.name,
      capacity: data.capacity,
      hourlyRateCents: data.hourlyRateCents,
      ...(data.status ? { status: data.status } : {}),
    },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "court.updated",
    module: "courts",
    entity: "Court",
    entityId: court.id,
  });
  return court;
}

export async function deleteCourt(ctx: TenantContext, courtId: string) {
  await requireModule(ctx, "courts");
  await authorize(ctx, "delete", "courts", "courts");
  const existing = await prisma.court.findFirst({
    where: { id: courtId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Court not found", "NOT_FOUND", 404);

  const court = await prisma.court.update({
    where: { id: courtId },
    data: { status: "INACTIVE" },
  });
  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "court.deleted",
    module: "courts",
    entity: "Court",
    entityId: court.id,
  });
  return court;
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
  // Overlap rule matches rangesOverlap() in booking-conflict.ts:
  // existing.start < newEnd AND existing.end > newStart
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
    courtId?: string;
    staffProfileId?: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    startAt: string;
    endAt: string;
    notes?: string;
    totalCents?: number;
    status?: "PENDING" | "CONFIRMED";
  },
) {
  await requireModule(ctx, "bookings");
  await authorize(ctx, "create", "bookings", "bookings");

  const courtId = data.courtId?.trim() || undefined;
  const staffProfileId = data.staffProfileId?.trim() || undefined;
  if (!courtId && !staffProfileId) {
    throw new AppError(
      "Select a court and/or a staff member",
      "VALIDATION",
      400,
    );
  }

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);
  if (!(startAt < endAt)) {
    throw new AppError("End time must be after start time", "VALIDATION", 400);
  }

  const court = courtId
    ? await prisma.court.findFirst({
        where: { id: courtId, businessId: ctx.businessId },
      })
    : null;
  if (courtId && !court) {
    throw new AppError("Court not found", "NOT_FOUND", 404);
  }

  const staff = staffProfileId
    ? await prisma.staffProfile.findFirst({
        where: {
          id: staffProfileId,
          businessId: ctx.businessId,
          status: "ACTIVE",
        },
      })
    : null;
  if (staffProfileId && !staff) {
    throw new AppError("Staff not found", "NOT_FOUND", 404);
  }

  const hours =
    (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
  const suggestedTotal =
    ((court?.hourlyRateCents ?? 0) + (staff?.hourlyRateCents ?? 0)) * hours;
  const totalCents =
    data.totalCents !== undefined && data.totalCents !== null
      ? Number(data.totalCents)
      : suggestedTotal;

  return prisma.$transaction(async (tx) => {
    if (courtId) {
      const courtConflict = await tx.booking.findFirst({
        where: {
          courtId,
          status: { in: ["PENDING", "CONFIRMED"] },
          AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        },
      });
      if (courtConflict) {
        throw new AppError(
          "Court is already booked for this time",
          "CONFLICT",
          409,
        );
      }
    }

    if (staffProfileId) {
      const staffConflict = await tx.booking.findFirst({
        where: {
          staffProfileId,
          status: { in: ["PENDING", "CONFIRMED"] },
          AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        },
      });
      if (staffConflict) {
        throw new AppError(
          "Staff is already booked for this time",
          "CONFLICT",
          409,
        );
      }
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
        courtId: courtId ?? null,
        staffProfileId: staffProfileId ?? null,
        customerId: customerId ?? null,
        startAt,
        endAt,
        notes: data.notes,
        totalCents,
        status: data.status ?? "CONFIRMED",
      },
    });

    await logActivity({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "booking.created",
      module: "bookings",
      entity: "Booking",
      entityId: booking.id,
      metadata: {
        courtId: courtId ?? null,
        staffProfileId: staffProfileId ?? null,
        totalCents,
      },
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
    include: { court: { include: { facility: true } }, customer: true, staffProfile: true },
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
    membershipId?: string;
    method?: string;
    reference?: string;
    notes?: string;
    cashbookAccountId?: string;
  },
) {
  await requireModule(ctx, "payments");
  await authorize(ctx, "create", "payments", "payments");

  if (data.membershipId) {
    const membership = await prisma.membership.findFirst({
      where: { id: data.membershipId, businessId: ctx.businessId },
    });
    if (!membership) {
      throw new AppError("Membership not found", "NOT_FOUND", 404);
    }
  }

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        businessId: ctx.businessId,
        amountCents: data.amountCents,
        currency: ctx.currency,
        customerId: data.customerId,
        bookingId: data.bookingId,
        membershipId: data.membershipId,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        status: "COMPLETED",
      },
    });

    if (data.cashbookAccountId) {
      await postCashbookPayment(ctx, {
        paymentId: created.id,
        accountId: data.cashbookAccountId,
        amountCents: created.amountCents,
        category: "Payment",
        description: `Payment ${created.reference ?? ""}`.trim() || "Payment",
        tx,
      });
    }

    return created;
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

export async function refundPayment(ctx: TenantContext, paymentId: string) {
  await requireModule(ctx, "payments");
  await authorize(ctx, "refund", "payments", "payments");

  const existing = await prisma.payment.findFirst({
    where: { id: paymentId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Payment not found", "NOT_FOUND", 404);
  if (existing.status !== "COMPLETED") {
    throw new AppError("Only completed payments can be refunded", "VALIDATION", 400);
  }

  const gateway = createPaymentGateway();
  const gatewayResult = await gateway.refund({
    paymentId: existing.id,
    amountCents: existing.amountCents,
    currency: existing.currency,
    reference: existing.reference ?? undefined,
  });

  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
    });

    await reverseCashbookPayment(ctx, { paymentId, tx });

    return updated;
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "payment.refunded",
    module: "payments",
    entity: "Payment",
    entityId: payment.id,
    metadata: {
      gateway: gatewayResult.provider,
      externalId: gatewayResult.externalId,
      ...gatewayResult.metadata,
    },
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
    benefits?: string[] | string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  const { createMembershipProduct: create } = await import(
    "@/server/services/memberships"
  );
  return create(ctx, data);
}

export async function assignMembership(
  ctx: TenantContext,
  data: {
    customerId: string;
    productId: string;
    startDate?: string;
    paymentStatus?: "PENDING" | "COMPLETED";
    paymentMethod?: string;
  },
) {
  const { assignMembership: assign } = await import(
    "@/server/services/memberships"
  );
  return assign(ctx, data);
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
  data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
    phone?: string;
    title?: string;
    hourlyRateCents?: number;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  await requireModule(ctx, "staff");
  await authorize(ctx, "create", "staff", "staff");
  await assertCanAssignRoles(ctx, [data.roleId]);

  const email = data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already in use", "CONFLICT", 409);
  }

  const signUp = await auth.api.signUpEmail({
    body: {
      email,
      password: data.password,
      name: data.name.trim(),
    },
  });
  if (!signUp?.user) {
    throw new AppError("Failed to create login for staff", "INTERNAL", 500);
  }

  const profileStatus = data.status ?? "ACTIVE";
  const membershipStatus = profileStatus === "ACTIVE" ? "ACTIVE" : "DISABLED";
  const hourlyRateCents = Number(data.hourlyRateCents) || 0;

  try {
    const staff = await prisma.$transaction(async (tx) => {
      if (membershipStatus === "DISABLED") {
        await tx.user.update({
          where: { id: signUp.user.id },
          data: { status: "DISABLED" },
        });
      }

      await tx.businessMembership.create({
        data: {
          userId: signUp.user.id,
          businessId: ctx.businessId,
          status: membershipStatus,
          roles: { create: [{ roleId: data.roleId }] },
        },
      });

      return tx.staffProfile.create({
        data: {
          businessId: ctx.businessId,
          userId: signUp.user.id,
          name: data.name.trim(),
          email,
          phone: data.phone?.trim() || null,
          title: data.title?.trim() || null,
          hourlyRateCents,
          status: profileStatus,
        },
      });
    });

    await logActivity({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "staff.created",
      module: "staff",
      entity: "StaffProfile",
      entityId: staff.id,
      metadata: {
        targetUserId: signUp.user.id,
        roleId: data.roleId,
        email,
        hourlyRateCents,
      },
    });

    return staff;
  } catch (error) {
    // Best-effort cleanup if membership/profile creation fails after signup
    await prisma.user.delete({ where: { id: signUp.user.id } }).catch(() => {});
    throw error;
  }
}

export async function updateStaff(
  ctx: TenantContext,
  staffId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    hourlyRateCents?: number;
    status?: "ACTIVE" | "INACTIVE";
    password?: string;
    roleId?: string;
  },
) {
  await requireModule(ctx, "staff");
  await authorize(ctx, "update", "staff", "staff");
  const existing = await prisma.staffProfile.findFirst({
    where: { id: staffId, businessId: ctx.businessId },
  });
  if (!existing) throw new AppError("Staff not found", "NOT_FOUND", 404);

  const name = data.name.trim();
  const email = data.email?.trim().toLowerCase() || null;
  const phone = data.phone?.trim() || null;
  const title = data.title?.trim() || null;
  const hourlyRateCents =
    data.hourlyRateCents !== undefined
      ? Number(data.hourlyRateCents) || 0
      : existing.hourlyRateCents;
  const status = data.status;

  // Provision login for profiles that do not have a user yet
  if (!existing.userId) {
    const password = data.password?.trim();
    const roleId = data.roleId?.trim();
    if (!email) {
      throw new AppError(
        "Email is required to enable login",
        "VALIDATION",
        400,
      );
    }
    if (!password || password.length < 8) {
      throw new AppError(
        "Password (min 8 characters) is required to enable login",
        "VALIDATION",
        400,
      );
    }
    if (!roleId) {
      throw new AppError("Role is required to enable login", "VALIDATION", 400);
    }

    await assertCanAssignRoles(ctx, [roleId]);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email already in use", "CONFLICT", 409);
    }

    const signUp = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    if (!signUp?.user) {
      throw new AppError("Failed to create login for staff", "INTERNAL", 500);
    }

    const profileStatus = status ?? existing.status;
    const membershipStatus = profileStatus === "ACTIVE" ? "ACTIVE" : "DISABLED";

    try {
      const staff = await prisma.$transaction(async (tx) => {
        if (membershipStatus === "DISABLED") {
          await tx.user.update({
            where: { id: signUp.user.id },
            data: { status: "DISABLED" },
          });
        }

        await tx.businessMembership.create({
          data: {
            userId: signUp.user.id,
            businessId: ctx.businessId,
            status: membershipStatus,
            roles: { create: [{ roleId }] },
          },
        });

        return tx.staffProfile.update({
          where: { id: staffId },
          data: {
            userId: signUp.user.id,
            name,
            email,
            phone,
            title,
            hourlyRateCents,
            ...(status ? { status } : {}),
          },
        });
      });

      await logActivity({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "staff.login_enabled",
        module: "staff",
        entity: "StaffProfile",
        entityId: staff.id,
        metadata: { targetUserId: signUp.user.id, roleId, email },
      });

      return staff;
    } catch (error) {
      await prisma.user.delete({ where: { id: signUp.user.id } }).catch(() => {});
      throw error;
    }
  }

  // Already has login: sync profile + linked user (no password change)
  if (email && email !== existing.email) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: existing.userId } },
    });
    if (taken) {
      throw new AppError("Email already in use", "CONFLICT", 409);
    }
  }

  const staff = await prisma.$transaction(async (tx) => {
    const updated = await tx.staffProfile.update({
      where: { id: staffId },
      data: {
        name,
        email,
        phone,
        title,
        hourlyRateCents,
        ...(status ? { status } : {}),
      },
    });

    if (existing.userId) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          name,
          ...(email ? { email } : {}),
          ...(status
            ? { status: status === "ACTIVE" ? "ACTIVE" : "DISABLED" }
            : {}),
        },
      });

      if (status) {
        await tx.businessMembership.updateMany({
          where: {
            userId: existing.userId,
            businessId: ctx.businessId,
          },
          data: { status: status === "ACTIVE" ? "ACTIVE" : "DISABLED" },
        });
      }
    }

    return updated;
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: "staff.updated",
    module: "staff",
    entity: "StaffProfile",
    entityId: staff.id,
  });

  return staff;
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

export async function listAvailabilityRules(ctx: TenantContext) {
  await requireModule(ctx, "bookings");
  await authorize(ctx, "view", "bookings", "bookings");
  return prisma.availabilityRule.findMany({
    where: { businessId: ctx.businessId },
    include: { court: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function createAvailabilityRule(
  ctx: TenantContext,
  data: {
    courtId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  },
) {
  await requireModule(ctx, "bookings");
  await authorize(ctx, "create", "bookings", "bookings");
  if (data.endTime <= data.startTime) {
    throw new AppError("End time must be after start time", "VALIDATION", 400);
  }
  if (data.courtId) {
    const court = await prisma.court.findFirst({
      where: { id: data.courtId, businessId: ctx.businessId },
    });
    if (!court) throw new AppError("Court not found", "NOT_FOUND", 404);
  }
  return prisma.availabilityRule.create({
    data: {
      businessId: ctx.businessId,
      courtId: data.courtId || null,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
}

export async function updateBookingStatus(
  ctx: TenantContext,
  bookingId: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
) {
  await requireModule(ctx, "bookings");
  if (status === "CANCELLED") {
    await authorize(ctx, "cancel", "bookings", "bookings");
  } else {
    await authorize(ctx, "update", "bookings", "bookings");
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId: ctx.businessId },
  });
  if (!booking) throw new AppError("Booking not found", "NOT_FOUND", 404);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  await logActivity({
    businessId: ctx.businessId,
    userId: ctx.userId,
    action: `booking.${status.toLowerCase()}`,
    module: "bookings",
    entity: "Booking",
    entityId: bookingId,
  });

  return updated;
}
