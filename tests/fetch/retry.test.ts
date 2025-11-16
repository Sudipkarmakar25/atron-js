import test from "node:test";
import assert from "node:assert/strict";
import { retry } from "../../src/fetch";

test("retry succeeds on first attempt", async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls++;
    return 1;
  }, 3);

  assert.equal(result, 1);
  assert.equal(calls, 1);
});

test("retry succeeds after several failures", async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls++;
    if (calls < 3) throw new Error("fail");
    return 99;
  }, 5);

  assert.equal(result, 99);
  assert.equal(calls, 3);
});

test("retry throws last error after exhausting attempts", async () => {
  let calls = 0;
  const err = new Error("always fails");
  await assert.rejects(
    retry(async () => {
      calls++;
      throw err;
    }, 3),
    err
  );
  assert.equal(calls, 3);
});

test("retry waits between attempts when delay is provided", async () => {
  let calls = 0;
  const start = Date.now();
  await assert.rejects(
    retry(async () => {
      calls++;
      throw new Error("fail");
    }, 3, 10),
    /fail/
  );
  const elapsed = Date.now() - start;
  // At least two waits of ~10ms each
  assert.ok(elapsed >= 15);
  assert.equal(calls, 3);
});

test("retry throws if attempts is not greater than 0", async () => {
  await assert.rejects(
    retry(async () => 1, 0),
    /attempts must be greater than 0/
  );
});
