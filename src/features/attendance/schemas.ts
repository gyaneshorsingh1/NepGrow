import { z } from "zod";

export const checkInSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  facilityId: z.string().optional(),
  notes: z.string().optional(),
});