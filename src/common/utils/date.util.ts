/**
 * Utility functions for handling date-only values.
 * 
 * PostgreSQL 'date' columns store dates without time/timezone.
 * When JavaScript parses "2026-01-19" with new Date(), it interprets 
 * it as UTC midnight, which can shift back a day in negative UTC offsets.
 * 
 * These utilities ensure dates are handled correctly.
 */

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding UTC interpretation.
 * Returns a Date object set to noon local time to prevent day shifts.
 */
export function parseLocalDate(dateString: string): Date {
  // Parse as YYYY-MM-DD and set to noon to avoid timezone edge cases
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Compare two date strings (YYYY-MM-DD format).
 * Returns negative if date1 < date2, 0 if equal, positive if date1 > date2.
 */
export function compareDateStrings(date1: string, date2: string): number {
  return date1.localeCompare(date2);
}

/**
 * Format a Date object or date string to YYYY-MM-DD format.
 */
export function formatDateString(date: Date | string): string {
  if (typeof date === 'string') {
    // Already a string, ensure it's in correct format
    return date.split('T')[0];
  }
  // Use local date parts to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
