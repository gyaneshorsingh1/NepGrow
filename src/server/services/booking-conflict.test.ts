import { describe, expect, it } from "vitest";

/**
 * Documents the booking overlap rule used by createBooking:
 * conflict when existing.start < newEnd AND existing.end > newStart
 */
function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

describe("booking conflict detection", () => {
  it("detects overlapping ranges", () => {
    expect(rangesOverlap(10, 12, 11, 13)).toBe(true);
    expect(rangesOverlap(10, 12, 12, 14)).toBe(false);
    expect(rangesOverlap(10, 12, 8, 10)).toBe(false);
    expect(rangesOverlap(10, 15, 11, 12)).toBe(true);
  });
});
