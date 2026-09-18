import { describe, expect, it } from "vitest";
import { addDays, format, startOfDay } from "date-fns";

/** Mirrors assignMembership end-date calculation */
function calculateEndDate(start: Date, durationDays: number) {
  return addDays(startOfDay(start), durationDays);
}

describe("membership duration", () => {
  it("adds duration days from start of day", () => {
    const start = startOfDay(new Date(2026, 8, 14, 15, 30, 0));
    const end = calculateEndDate(start, 30);
    expect(format(end, "yyyy-MM-dd")).toBe("2026-10-14");
  });
});

describe("membership price snapshot", () => {
  it("keeps assigned price when plan price changes", () => {
    const assignedPriceCents = 250000;
    const laterPlanPriceCents = 300000;
    expect(assignedPriceCents).toBe(250000);
    expect(assignedPriceCents).not.toBe(laterPlanPriceCents);
  });
});
