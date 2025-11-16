"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomNumber = randomNumber;
exports.isEven = isEven;
exports.clamp = clamp;
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
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Checks whether a number is even.
 *
 * @param num - The number to test.
 * @returns `true` if the number is evenly divisible by 2, otherwise `false`.
 */
// Check if number is even
function isEven(num) {
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
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
