/**
 * Fixed catalog of business operating models (stored as BusinessFeature.key).
 */
export const BUSINESS_MODEL_OPTIONS = [
  { key: "booking", label: "Booking" },
  { key: "time_based_usage", label: "Time-Based Usage" },
  { key: "membership", label: "Membership" },
  { key: "subscription", label: "Subscription" },
  { key: "scheduled_service", label: "Scheduled Service" },
  { key: "recurring_contract", label: "Recurring Contract" },
  { key: "delivery", label: "Delivery" },
  { key: "package", label: "Package" },
  { key: "pay_per_use", label: "Pay-Per-Use" },
] as const;

export type BusinessModelKey = (typeof BUSINESS_MODEL_OPTIONS)[number]["key"];

export const BUSINESS_MODEL_KEYS = BUSINESS_MODEL_OPTIONS.map((o) => o.key) as [
  BusinessModelKey,
  ...BusinessModelKey[],
];
