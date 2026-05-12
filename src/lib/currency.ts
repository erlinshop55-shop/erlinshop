/**
 * Utility for currency formatting and parsing (IDR)
 */

/**
 * Formats a number to IDR string with thousand separators (dots)
 * Example: 1000000 -> "1.000.000"
 */
export function formatIDR(value: number | string | undefined): string {
  if (value === undefined || value === null) return "";
  const numericValue = typeof value === "string" ? Number.parseInt(value.replace(/\./g, ""), 10) : value;
  if (Number.isNaN(numericValue)) return "";
  
  return new Intl.NumberFormat('id-ID').format(numericValue);
}

/**
 * Parses an IDR string back to a pure integer
 * Example: "1.000.000" -> 1000000
 */
export function parseIDR(value: string): number {
  if (!value) return 0;
  // Remove dots and other non-numeric characters (though dots are primary focus)
  const cleanValue = value.replace(/\./g, "").replaceAll(/\D/g, "");
  return cleanValue ? Number.parseInt(cleanValue, 10) : 0;
}

/**
 * Formats a value for input display, allowing real-time typing
 * This handles stripping non-numeric chars and then re-formatting
 */
export function formatInputIDR(value: string): string {
  const numericValue = value.replace(/\./g, "").replaceAll(/\D/g, "");
  if (!numericValue) return "";
  return new Intl.NumberFormat('id-ID').format(Number.parseInt(numericValue, 10));
}
