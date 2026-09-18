/**
 * Pure overlap rule used by createBooking / assertNoBookingConflict:
 * conflict when existing.start < newEnd AND existing.end > newStart
 * (adjacent ranges that only touch at an endpoint do not conflict).
 */
export function rangesOverlap(
  aStart: number | Date,
  aEnd: number | Date,
  bStart: number | Date,
  bEnd: number | Date,
): boolean {
  const as = aStart instanceof Date ? aStart.getTime() : aStart;
  const ae = aEnd instanceof Date ? aEnd.getTime() : aEnd;
  const bs = bStart instanceof Date ? bStart.getTime() : bStart;
  const be = bEnd instanceof Date ? bEnd.getTime() : bEnd;
  return as < be && ae > bs;
}
