import { describe, expect, it } from "vitest";

import { rangesOverlap } from "./booking-conflict";

describe("booking conflict detection", () => {
  it("detects overlapping ranges (numeric)", () => {
    expect(rangesOverlap(10, 12, 11, 13)).toBe(true);
    expect(rangesOverlap(10, 12, 12, 14)).toBe(false);
    expect(rangesOverlap(10, 12, 8, 10)).toBe(false);
    expect(rangesOverlap(10, 15, 11, 12)).toBe(true);
  });

  it("treats identical ranges as conflicting", () => {
    expect(rangesOverlap(100, 200, 100, 200)).toBe(true);
  });

  it("detects partial overlap on either side", () => {
    // new starts during existing
    expect(rangesOverlap(10, 20, 15, 25)).toBe(true);
    // new ends during existing
    expect(rangesOverlap(10, 20, 5, 15)).toBe(true);
    // new fully contains existing
    expect(rangesOverlap(10, 20, 5, 30)).toBe(true);
    // existing fully contains new
    expect(rangesOverlap(5, 30, 10, 20)).toBe(true);
  });

  it("allows back-to-back slots that only touch endpoints", () => {
    expect(rangesOverlap(10, 12, 12, 14)).toBe(false);
    expect(rangesOverlap(12, 14, 10, 12)).toBe(false);
  });

  it("works with Date instances (same rule as createBooking Prisma query)", () => {
    const existingStart = new Date("2026-06-01T10:00:00.000Z");
    const existingEnd = new Date("2026-06-01T11:00:00.000Z");
    const overlapStart = new Date("2026-06-01T10:30:00.000Z");
    const overlapEnd = new Date("2026-06-01T11:30:00.000Z");
    const adjacentStart = new Date("2026-06-01T11:00:00.000Z");
    const adjacentEnd = new Date("2026-06-01T12:00:00.000Z");

    expect(
      rangesOverlap(existingStart, existingEnd, overlapStart, overlapEnd),
    ).toBe(true);
    expect(
      rangesOverlap(existingStart, existingEnd, adjacentStart, adjacentEnd),
    ).toBe(false);
  });
});
