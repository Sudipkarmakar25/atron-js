/**
 * Capitalizes the first character of a string.
 *
 * If the input is an empty string or a falsy value, an empty string is returned.
 * The rest of the string is left unchanged.
 *
 * @param text - The input string to capitalize.
 * @returns A new string with the first character uppercased, or an empty string if input is falsy.
 */
// Capitalize first letter
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Reverses a string, preserving full Unicode characters (including emoji).
 *
 * Uses the spread operator to iterate over Unicode code points instead of
 * raw UTF-16 code units, so surrogate pairs (e.g. emoji) are reversed safely.
 *
 * @param text - The string to reverse.
 * @returns A new string with characters in reverse order.
 */
// Reverse a string
export function reverse(text: string): string {
  return [...text].reverse().join("");
}

/**
 * Checks whether a string is empty or contains only whitespace.
 *
 * This trims the string and checks the resulting length. Any combination of
 * spaces, tabs, or newline characters is considered empty.
 *
 * @param text - The string to check.
 * @returns `true` if the string is empty or whitespace-only, otherwise `false`.
 */
// Check if string is empty or only spaces
export function isEmpty(text: string): boolean {
  return !text || text.trim().length === 0;
}
