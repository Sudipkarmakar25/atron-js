import test from "node:test";
import assert from "node:assert/strict";
import { getJSON } from "../../src/fetch";

interface MockResponseInit {
  ok: boolean;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

function createMockResponse(init: MockResponseInit) {
  const headers = init.headers || { "content-type": "application/json" };
  return {
    ok: init.ok,
    status: init.status,
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      },
    },
    async json() {
      return init.body;
    },
  };
}

function withMockFetch(
  impl: (url: string, init: RequestInit | undefined, callIndex: number) => Promise<MockResponseInit>,
  fn: () => Promise<void>
) {
  return async () => {
    const originalFetch = (globalThis as any).fetch;
    let callIndex = 0;
    (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
      const mock = await impl(url, init, callIndex++);
      return createMockResponse(mock) as any;
    };

    try {
      await fn();
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  };
}

// 1: multiple successful JSON responses

test(
  "getJSON returns parsed JSON for multiple success cases",
  withMockFetch(async (url, _init, idx) => {
    const bodies = [
      { a: 1 },
      { b: "two" },
      [1, 2, 3],
      { nested: { value: true } },
      null,
      123,
      "text",
      false,
      { arr: [1, 2] },
      { mixed: [1, "two", { three: 3 }] },
    ];

    return {
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      body: bodies[idx],
    };
  }, async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/success/${i}`);
    const expectedBodies = [
      { a: 1 },
      { b: "two" },
      [1, 2, 3],
      { nested: { value: true } },
      null,
      123,
      "text",
      false,
      { arr: [1, 2] },
      { mixed: [1, "two", { three: 3 }] },
    ];

    for (let i = 0; i < urls.length; i++) {
      const data = await getJSON(urls[i]);
      assert.deepEqual(data, expectedBodies[i]);
    }
  })
);

// 2: non-OK statuses

test(
  "getJSON throws for non-ok HTTP statuses",
  withMockFetch(async (url, _init, idx) => {
    const statuses = [400, 401, 403, 404, 500, 502, 503];
    return {
      ok: false,
      status: statuses[idx],
      headers: { "content-type": "application/json" },
      body: { error: "fail" },
    };
  }, async () => {
    const urls = [400, 401, 403, 404, 500, 502, 503].map(code => `https://example.com/status/${code}`);

    for (const url of urls) {
      await assert.rejects(
        getJSON(url),
        /failed with status/
      );
    }
  })
);

// 3: non-JSON content types

test(
  "getJSON throws for non-JSON content-type",
  withMockFetch(async (_url, _init, idx) => {
    const contentTypes = [
      "text/plain",
      "text/html",
      "application/xml",
      "image/png",
      "application/octet-stream",
    ];
    return {
      ok: true,
      status: 200,
      headers: { "content-type": contentTypes[idx] },
      body: "not-json",
    };
  }, async () => {
    const urls = [0, 1, 2, 3, 4].map(i => `https://example.com/non-json/${i}`);

    for (const url of urls) {
      await assert.rejects(
        getJSON(url),
        /Expected JSON response/
      );
    }
  })
);

// 4: timeout handling

test(
  "getJSON times out when fetch is too slow",
  withMockFetch(async () => {
    return new Promise<MockResponseInit>(() => {
      // never resolve -> let timeout wrapper handle it
    });
  }, async () => {
    await assert.rejects(
      getJSON("https://example.com/slow", { timeoutMs: 10 }),
      /timed out/
    );
  })
);

// 5: options are passed through to fetch (method, headers, body)

test(
  "getJSON passes method and headers to fetch",
  withMockFetch(async (_url, init) => {
    assert.equal(init?.method, "PUT");
    const headers = (init?.headers || {}) as any;
    assert.equal(headers["X-Test"], "1");

    return {
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true },
    };
  }, async () => {
    const data = await getJSON("https://example.com/with-options", {
      method: "PUT",
      headers: { "X-Test": "1" },
    });
    assert.deepEqual(data, { ok: true });
  })
);
