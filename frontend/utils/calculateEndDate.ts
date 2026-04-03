/**
 * Calculates the end date of a medicine supply.
 *
 * Formula: endDate = startDate + floor(totalTablets / (tabletsPerDose * dosesPerDay)) days
 *
 * @param totalTablets   Total number of tablets in the pack (must be > 0)
 * @param tabletsPerDose Number of tablets taken per dose (must be > 0)
 * @param dosesPerDay    Number of doses taken per day (must be > 0; can be fractional e.g. 1/7 for weekly)
 * @param startDate      Start date (defaults to today at midnight local time)
 * @returns              The calculated end date at midnight local time
 */
export function calculateEndDate(
  totalTablets: number,
  tabletsPerDose: number,
  dosesPerDay: number,
  startDate?: Date
): Date {
  if (totalTablets <= 0 || tabletsPerDose <= 0 || dosesPerDay <= 0) {
    throw new Error('totalTablets, tabletsPerDose, and dosesPerDay must all be greater than 0');
  }

  const base = startDate ? new Date(startDate) : new Date();
  base.setHours(0, 0, 0, 0);

  const daysOfSupply = Math.floor(totalTablets / (tabletsPerDose * dosesPerDay));

  const end = new Date(base);
  end.setDate(end.getDate() + daysOfSupply);
  return end;
}

/**
 * Returns the number of calendar days remaining until endDate.
 * Negative values mean the medicine has expired.
 */
export function getDaysRemaining(endDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
