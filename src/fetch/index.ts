// Fetch and async helpers
import type { JSONValue, GetJSONOptions, PostJSONOptions } from "../types/fetch";

/**
 * Fetches a URL and parses the response as JSON.
 *
 * Features:
 * - Throws if the HTTP status is not OK (`response.ok === false`).
 * - Throws if the `Content-Type` header does not include `"application/json"`.
 * - Optional timeout support via {@link GetJSONOptions.timeoutMs}.
 *
 * @typeParam T - The expected JSON shape of the response.
 * @param url - The URL to fetch.
 * @param options - Fetch options plus an optional `timeoutMs` value.
 * @returns A promise that resolves with the parsed JSON response.
 * @throws If the request fails, times out, or the response is not JSON.
 */
export async function getJSON<T = JSONValue>(
  url: string,
  options: GetJSONOptions = {}
): Promise<T> {
  const { timeoutMs, ...fetchOptions } = options;

  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  if (controller) {
    (fetchOptions as RequestInit).signal = controller.signal;
  }

  const fetchPromise = fetch(url, fetchOptions);

  const response = await (timeoutMs
    ? timeout(fetchPromise, timeoutMs, `Request to ${url} timed out after ${timeoutMs}ms`)
    : fetchPromise);

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON response from ${url} but got content-type: ${contentType}`);
  }

  return (response.json() as unknown) as T;
}

/**
 * Sends a JSON `POST` request and parses the JSON response.
 *
 * This helper automatically stringifies the request body and sets the
 * `Content-Type: application/json` header (which can be overridden in
 * `options.headers`).
 *
 * It internally reuses {@link getJSON} for response handling and timeout
 * behavior.
 *
 * @typeParam TBody - The shape of the request body.
 * @typeParam TResponse - The expected JSON response shape.
 * @param url - The URL to send the request to.
 * @param body - The JSON-serializable request payload.
 * @param options - Additional fetch options and optional `timeoutMs`.
 * @returns A promise that resolves with the parsed JSON response.
 */
export async function postJSON<TBody = unknown, TResponse = JSONValue>(
  url: string,
  body: TBody,
  options: PostJSONOptions = {}
): Promise<TResponse> {
  const { timeoutMs, headers, ...fetchOptions } = options;

  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  return getJSON<TResponse>(url, {
    ...fetchOptions,
    method: "POST",
    headers: mergedHeaders,
    body: JSON.stringify(body),
    timeoutMs,
  } as GetJSONOptions);
}

/**
 * Retries an asynchronous operation a fixed number of times.
 *
 * If the function keeps throwing, the last error is re-thrown after all
 * attempts are exhausted. An optional delay (in milliseconds) can be
 * applied between attempts.
 *
 * @typeParam T - The resolved type of the retried function.
 * @param fn - A function returning a promise to be retried.
 * @param attempts - Maximum number of attempts (must be > 0).
 * @param delayMs - Optional delay in milliseconds between attempts.
 * @returns The result of the first successful attempt.
 * @throws If all attempts fail, rethrows the last encountered error.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs = 0
): Promise<T> {
  if (attempts <= 0) {
    throw new Error("attempts must be greater than 0");
  }

  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1 && delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError ?? new Error("retry failed without an explicit error");
}

/**
 * Wraps a promise and enforces a timeout.
 *
 * If the promise does not resolve or reject within the specified number of
 * milliseconds, the returned promise rejects with a timeout error.
 *
 * @typeParam T - The resolved type of the wrapped promise.
 * @param promise - The promise to wrap.
 * @param ms - Timeout duration in milliseconds.
 * @param message - Optional custom error message.
 * @returns A promise that resolves or rejects with the underlying promise,
 *          or rejects with a timeout error.
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = `Operation timed out after ${ms}ms`
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => 
        {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Sleeps for a given number of milliseconds.
 *
 * This is similar to {@link delay} but lives in the fetch helpers module
 * for convenience when coordinating async network operations.
 *
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Runs an array of asynchronous tasks sequentially.
 *
 * Each task is a function returning a promise. The next task will only
 * start after the previous one has completed.
 *
 * @typeParam T - The result type of each task.
 * @param tasks - An array of functions that each return a promise.
 * @returns A promise resolving to an array of results in the same order
 *          as the tasks.
 */
export async function sequence<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

/**
 * Runs asynchronous tasks in parallel with an optional concurrency limit.
 *
 * Tasks are functions that return promises. At most `limit` tasks are run
 * at the same time. Results are ordered to correspond with the input tasks
 * array.
 *
 * @typeParam T - The result type of each task.
 * @param tasks - An array of functions that each return a promise.
 * @param limit - Maximum number of concurrent tasks (must be > 0).
 * @returns A promise resolving to an array of results.
 * @throws If `limit` is not greater than 0, or if any task rejects.
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  limit = Infinity
): Promise<T[]> {
  if (limit <= 0) {
    throw new Error("limit must be greater than 0");
  }

  const results: T[] = new Array(tasks.length);
  let index = 0;
  let active = 0;

  return new Promise<T[]>((resolve, reject) => {
    const runNext = () => {
      if (index >= tasks.length && active === 0) {
        resolve(results);
        return;
      }

      while (active < limit && index < tasks.length) {
        const currentIndex = index++;
        const task = tasks[currentIndex];
        active++;

        task()
          .then(result => {
            results[currentIndex] = result;
            active--;
            runNext();
          })
          .catch(error => {
            reject(error);
          });
      }
    };

    runNext();
  });
}

/**
 * Splits an array into evenly sized batches.
 *
 * The final batch may contain fewer than `size` elements if the total
 * number of items is not a multiple of `size`.
 *
 * @typeParam T - The type of items in the input array.
 * @param items - The array of items to split.
 * @param size - The maximum size of each batch (must be > 0).
 * @returns An array of batches (sub-arrays) of the original items.
 * @throws If `size` is not greater than 0.
 */
export function batch<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error("size must be greater than 0");
  }

  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
