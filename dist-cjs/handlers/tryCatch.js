"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = tryCatch;
/**
 * Wraps a synchronous or asynchronous function in a `try/catch` and returns
 * a tuple containing the result and any error.
 *
 * This is useful when you prefer `[data, error]`-style control flow instead
 * of `try/catch` blocks:
 *
 * ```ts
 * const [user, err] = await tryCatch(() => getUser(id));
 * if (err) {
 *   // handle error
 * }
 * ```
 *
 * @typeParam T - The resolved result type of the wrapped function.
 * @param fn - A function that may return a value or a promise.
 * @returns A promise resolving to `[data, error]`, where `data` is `null` when an error occurs.
 */
async function tryCatch(fn) {
    try {
        const data = await fn();
        return [data, null];
    }
    catch (error) {
        return [null, error];
    }
}
