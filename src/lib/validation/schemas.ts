import { z } from "zod";

export const createClientSchema = z.object({
  businessName: z.string().min(2).max(120),
  categoryId: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  loginEmail: z.string().email(),
  loginName: z.string().min(2).max(80),
  password: z.string().min(8).max(128),
  planId: z.string().min(1),
  moduleIds: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientStatusSchema = z.object({
  businessId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"]),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  key: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const createFacilitySchema = z.object({
  name: z.string().min(2).max(120),
  sport: z.string().min(2).max(80),
  description: z.string().optional(),
});

export const createCourtSchema = z.object({
  facilityId: z.string().min(1),
  name: z.string().min(1).max(80),
  capacity: z.coerce.number().int().positive().optional(),
  hourlyRateCents: z.coerce.number().int().min(0).default(0),
});

export const createBookingSchema = z.object({
  courtId: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional(),
  totalCents: z.coerce.number().int().min(0).default(0),
});

export const createMembershipProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  durationDays: z.coerce.number().int().positive().default(30),
});

export const createPaymentSchema = z.object({
  customerId: z.string().optional(),
  bookingId: z.string().optional(),
  amountCents: z.coerce.number().int().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
