import test from "node:test";
import assert from "node:assert/strict";
import { parallel } from "../../src/fetch";

test("parallel resolves all tasks and preserves order", async () => {
  const tasks = [
    () => new Promise<number>(resolve => setTimeout(() => resolve(1), 20)),
    () => new Promise<number>(resolve => setTimeout(() => resolve(2), 10)),
    () => new Promise<number>(resolve => setTimeout(() => resolve(3), 5)),
  ];

  const results = await parallel(tasks, Infinity);
  assert.deepEqual(results, [1, 2, 3]);
});

test("parallel respects concurrency limit", async () => {
  let active = 0;
  let maxActive = 0;

  const tasks = Array.from({ length: 20 }, (_, i) => async () => {
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise<void>(resolve => setTimeout(resolve, 2));
    active--;
    return i;
  });

  const results = await parallel(tasks, 3);
  assert.equal(maxActive <= 3, true);
  assert.equal(results.length, tasks.length);
});

test("parallel rejects when any task fails", async () => {
  const error = new Error("fail");
  const tasks = [
    () => Promise.resolve(1),
    () => Promise.reject(error),
    () => Promise.resolve(3),
  ];

  await assert.rejects(parallel(tasks, 2), error);
});

test("parallel throws if limit is not greater than 0", async () => {
  const tasks = [() => Promise.resolve(1)];
  await assert.rejects(
    parallel(tasks, 0),
    /limit must be greater than 0/
  );
});
