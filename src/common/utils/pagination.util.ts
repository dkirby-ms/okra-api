/**
 * Utility functions for cursor-based pagination.
 * Cursors are base64-encoded composite values (createdAt + id) for stable ordering.
 */

/**
 * Composite cursor structure for stable pagination.
 */
export interface ComposedCursor {
  createdAt: string;
  id: string;
}

/**
 * Encode a cursor value (typically a timestamp or ID) for use in URLs.
 * @param value - The value to encode (usually ISO timestamp or UUID)
 * @returns Base64-encoded cursor string
 */
export function encodeCursor(createdAt: Date, id: string): string {
  const cursor: ComposedCursor = {
    createdAt: createdAt.toISOString(),
    id,
  };
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64');
}

/**
 * Decode a cursor string back to its composite value.
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded composite cursor value or null if invalid
 */
export function decodeCursor(cursor: string): ComposedCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded) as ComposedCursor;
    if (parsed.createdAt && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a decoded cursor as a Date (for timestamp-based cursors).
 * @param cursor - Decoded cursor string (ISO timestamp)
 * @returns Date object
 * @throws Error if cursor is not a valid date
 */
export function parseCursorAsDate(cursor: string): Date {
  const decoded = decodeCursor(cursor);
  if (!decoded) {
    throw new Error('Invalid cursor format');
  }
  const date = new Date(decoded.createdAt);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid cursor: not a valid date');
  }
  return date;
}

/**
 * Create a cursor from the last item in a result set.
 * @param items - Array of items with createdAt and id properties
 * @returns Encoded cursor or null if no items
 */
export function createCursorFromItems<T extends { createdAt: Date; id: string }>(
  items: T[],
): string | null {
  if (items.length === 0) {
    return null;
  }
  const lastItem = items[items.length - 1];
  return encodeCursor(lastItem.createdAt, lastItem.id);
}
