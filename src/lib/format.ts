/**
 * format.ts — Currency and number formatting utilities for Lucía Rojas Studio
 * All prices are in Guaraníes (PYG). No conversion, no decimals.
 */

/**
 * Formats a Guaraní amount with Paraguayan thousands separator (dots).
 * Examples:
 *   150000  → "Gs. 150.000"
 *   1800000 → "Gs. 1.800.000"
 *   59000   → "Gs. 59.000"
 */
export function formatPYG(amount: number | string): string {
  const n = Math.round(Number(amount) || 0);
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Gs. ${formatted}`;
}

/**
 * Returns only the number part formatted (no "Gs." prefix).
 * Use when you render the currency symbol separately.
 */
export function formatPYGNumber(amount: number | string): string {
  const n = Math.round(Number(amount) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
