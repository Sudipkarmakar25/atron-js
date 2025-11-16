/**
 * Returns a random integer between `min` and `max` (inclusive).
 *
 * This uses `Math.random()` and `Math.floor()` to map the random value into
 * the given range.
 *
 * @param min - The minimum integer value (inclusive).
 * @param max - The maximum integer value (inclusive).
 * @returns A random integer between `min` and `max`.
 */
// Return random number between min and max
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Checks whether a number is even.
 *
 * @param num - The number to test.
 * @returns `true` if the number is evenly divisible by 2, otherwise `false`.
 */
// Check if number is even
export function isEven(num: number): boolean {
  return num % 2 === 0;
}

/**
 * Clamps a numeric value so that it stays within the `[min, max]` range.
 *
 * Values lower than `min` are snapped to `min`, and values greater than `max`
 * are snapped to `max`.
 *
 * @param num - The number to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns The clamped value.
 */
// Clamp a number between min & max
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}
