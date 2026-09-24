import { z } from "zod";

import { BUSINESS_MODEL_KEYS } from "@/lib/business-models";

export const createClientSchema = z.object({
  businessName: z.string().min(2).max(120),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional().or(z.literal("")),
  businessModels: z.array(z.enum(BUSINESS_MODEL_KEYS)).default([]),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum(["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"])
    .default("ACTIVE"),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/)
    .default("NPR"),
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

export const updateClientProfileSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "CANCELLED"]),
});

export const changeClientPlanSchema = z.object({
  businessId: z.string().min(1),
  planId: z.string().min(1),
});

export const updateClientModulesSchema = z.object({
  businessId: z.string().min(1),
  moduleIds: z.array(z.string()).default([]),
});

export const setClientPermissionsSchema = z.object({
  businessId: z.string().min(1),
  roleId: z.string().min(1),
  permissionIds: z.array(z.string()).default([]),
});

export const createTenantUserSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: z.string().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});

export const setTenantUserStatusSchema = z.object({
  businessId: z.string().min(1),
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export const createAvailabilityRuleSchema = z.object({
  courtId: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const assignMembershipSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  startDate: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "COMPLETED"]).default("COMPLETED"),
  paymentMethod: z.string().optional(),
  cashbookAccountId: z.string().optional(),
});

export const cancelMembershipSchema = z.object({
  membershipId: z.string().min(1),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  key: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Key must be lowercase alphanumeric with dashes")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const deleteRoleSchema = z.object({
  id: z.string().min(1),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: z.string().min(1),
  permissionIds: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});

export const updateEmployeeRolesSchema = z.object({
  membershipId: z.string().min(1),
  roleIds: z.array(z.string()).min(1),
});

export const setEmployeeDirectPermissionsSchema = z.object({
  membershipId: z.string().min(1),
  permissionIds: z.array(z.string()).default([]),
});

export const setEmployeeStatusSchema = z.object({
  membershipId: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  id: z.string().min(1),
});

export const deleteCustomerSchema = z.object({
  id: z.string().min(1),
});

export const createFacilitySchema = z.object({
  name: z.string().min(2).max(120),
  sport: z.string().min(2).max(80),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateFacilitySchema = createFacilitySchema.extend({
  id: z.string().min(1),
});

export const deleteFacilitySchema = z.object({
  id: z.string().min(1),
});

export const createCourtSchema = z.object({
  facilityId: z.string().min(1),
  name: z.string().min(1).max(80),
  capacity: z.coerce.number().int().positive().optional(),
  hourlyRateCents: z.coerce.number().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateCourtSchema = createCourtSchema.extend({
  id: z.string().min(1),
});

export const deleteCourtSchema = z.object({
  id: z.string().min(1),
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
  totalCents: z.coerce.number().min(0).default(0),
  status: z.enum(["PENDING", "CONFIRMED"]).default("CONFIRMED"),
});

export const createStaffSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateStaffSchema = createStaffSchema.extend({
  id: z.string().min(1),
});

export const createMembershipProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  priceCents: z.coerce.number().min(0),
  durationDays: z.coerce.number().int().positive().default(30),
  benefits: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const updateMembershipProductSchema = createMembershipProductSchema.extend({
  id: z.string().min(1),
});

export const setMembershipProductStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const deleteMembershipProductSchema = z.object({
  id: z.string().min(1),
});

export const createPaymentSchema = z.object({
  customerId: z.string().optional(),
  bookingId: z.string().optional(),
  membershipId: z.string().optional(),
  amountCents: z.coerce.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  cashbookAccountId: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1),
});

export const completeMembershipPaymentSchema = z.object({
  membershipId: z.string().min(1),
  paymentMethod: z.enum(["cash", "esewa", "khalti", "bank"]).default("cash"),
  cashbookAccountId: z.string().optional(),
});

export const createCashbookAccountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["CASH", "BANK", "WALLET", "OTHER"]).optional().default("CASH"),
  openingBalanceCents: z.coerce.number().default(0),
  notes: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateCashbookAccountSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  type: z.enum(["CASH", "BANK", "WALLET", "OTHER"]).optional(),
  openingBalanceCents: z.coerce.number().optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const deleteCashbookAccountSchema = z.object({
  accountId: z.string().min(1),
});

export const createAccountingTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amountCents: z.coerce.number().positive(),
  category: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  reference: z.string().max(120).optional(),
  occurredAt: z.string().optional(),
});

export const deleteAccountingTransactionSchema = z.object({
  transactionId: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateWebsiteContentSchema = z.object({
  heroHeadline: z.string().max(200).optional().default(""),
  heroSubheadline: z.string().max(500).optional().default(""),
  about: z.string().max(5000).optional().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")).default(""),
  contactPhone: z.string().max(40).optional().default(""),
  address: z.string().max(300).optional().default(""),
  seoTitle: z.string().max(120).optional().default(""),
  seoDescription: z.string().max(320).optional().default(""),
  indexable: z.coerce.boolean().default(true),
  published: z.coerce.boolean().default(true),
});

export type UpdateWebsiteContentInput = z.infer<typeof updateWebsiteContentSchema>;

/** Empty string → null; used on create where category is always settable. */
const categoryIdCreate = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.string().min(1).nullable(),
);

/**
 * Omitted → undefined (no change); ""/null → null (clear); string → id.
 */
const categoryIdUpdate = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (v === "" || v === null) return null;
  return v;
}, z.string().min(1).nullable().optional());

const planLimitsSchema = z.record(
  z.string(),
  z.coerce.number().int().nonnegative(),
);

export const createPlanSchema = z.object({
  name: z.string().min(2).max(120),
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().nullable(),
  categoryId: categoryIdCreate,
  priceCents: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default("NPR"),
  billingInterval: z.enum(["MONTHLY", "YEARLY", "LIFETIME"]).default("MONTHLY"),
  limits: planLimitsSchema.default({}),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().default(0),
  moduleIds: z.array(z.string()).default([]),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120).optional(),
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().optional().nullable(),
  categoryId: categoryIdUpdate,
  priceCents: z.coerce.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  billingInterval: z.enum(["MONTHLY", "YEARLY", "LIFETIME"]).optional(),
  limits: planLimitsSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export const createModuleSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric with hyphens"),
  name: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  categoryId: categoryIdCreate,
  isCore: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  icon: z.string().optional().nullable(),
  href: z.string().optional().nullable(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = z.object({
  id: z.string().min(1),
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric with hyphens")
    .optional(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().optional().nullable(),
  categoryId: categoryIdUpdate,
  isCore: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  icon: z.string().optional().nullable(),
  href: z.string().optional().nullable(),
});

export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;

export const setPlanModulesSchema = z.object({
  planId: z.string().min(1),
  moduleIds: z.array(z.string()).default([]),
});

export type SetPlanModulesInput = z.infer<typeof setPlanModulesSchema>;

export const deletePlanSchema = z.object({
  id: z.string().min(1),
});

export const deleteModuleSchema = z.object({
  id: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  domainSlug: z
    .string()
    .min(3)
    .max(120)
    .regex(
      /^[a-z0-9-]+(\.[a-z0-9-]+)*$/,
      "Domain slug must look like example.nepgrow.com",
    ),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  domainSlug: z
    .string()
    .min(3)
    .max(120)
    .regex(
      /^[a-z0-9-]+(\.[a-z0-9-]+)*$/,
      "Domain slug must look like example.nepgrow.com",
    )
    .optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const deleteCategorySchema = z.object({
  id: z.string().min(1),
});

export const createCurrencySchema = z.object({
  code: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code"),
  name: z.string().min(2).max(80),
  symbol: z.string().max(8).optional().or(z.literal("")),
  decimals: z.coerce.number().int().min(0).max(4).default(2),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().default(100),
});

export const updateCurrencySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  symbol: z.string().max(8).optional().nullable(),
  decimals: z.coerce.number().int().min(0).max(4).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const setBusinessCurrencySchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code"),
});

export const createAndSetBusinessCurrencySchema = z.object({
  code: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code"),
  name: z.string().min(2).max(80),
  symbol: z.string().max(8).optional().or(z.literal("")),
  decimals: z.coerce.number().int().min(0).max(4).default(2),
});

export const updateBusinessProfileSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  timezone: z.string().min(2).max(80).default("Asia/Kathmandu"),
});
