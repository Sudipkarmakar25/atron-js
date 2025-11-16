import test from "node:test";
import assert from "node:assert/strict";
import { postJSON } from "../../src/fetch";

interface RecordedRequest {
  url: string;
  init: RequestInit | undefined;
}

function withRecordingFetch(
  responses: Array<{ status?: number; body?: unknown; contentType?: string }>,
  fn: (records: RecordedRequest[]) => Promise<void>
) {
  return async () => {
    const originalFetch = (globalThis as any).fetch;
    const records: RecordedRequest[] = [];
    let callIndex = 0;

    (globalThis as any).fetch = async (url: string, init?: RequestInit) => {
      records.push({ url, init });
      const { status = 200, body = { ok: true }, contentType = "application/json" } =
        responses[Math.min(callIndex++, responses.length - 1)];

      return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
          get(name: string) {
            if (name.toLowerCase() === "content-type") return contentType;
            return null;
          },
        },
        async json() {
          return body;
        },
      } as any;
    };

    try {
      await fn(records);
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  };
}

// 1: simple POST with JSON body

test(
  "postJSON sends JSON body and returns parsed response",
  withRecordingFetch([{ body: { success: true } }], async records => {
    const result = await postJSON("https://example.com/post", { a: 1 });
    assert.deepEqual(result, { success: true });

    assert.equal(records.length, 1);
    const [req] = records;
    assert.equal(req.url, "https://example.com/post");
    assert.equal(req.init?.method, "POST");
    const headers = (req.init?.headers || {}) as any;
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(req.init?.body, JSON.stringify({ a: 1 }));
  })
);

// 2: multiple POST bodies

test(
  "postJSON correctly serializes different bodies",
  withRecordingFetch(
    [
      { body: { id: 1 } },
      { body: { id: 2 } },
      { body: { id: 3 } },
      { body: { id: 4 } },
      { body: { id: 5 } },
    ],
    async records => {
      const bodies = [
        { a: 1 },
        { b: "two" },
        [1, 2, 3],
        { nested: { x: true } },
        null,
      ];

      const results = [] as any[];
      for (let i = 0; i < bodies.length; i++) {
        const res = await postJSON(`https://example.com/multi/${i}`, bodies[i]);
        results.push(res);
      }

      assert.deepEqual(results, [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ]);

      assert.equal(records.length, bodies.length);
      for (let i = 0; i < records.length; i++) {
        const { url, init } = records[i];
        assert.equal(url, `https://example.com/multi/${i}`);
        assert.equal(init?.method, "POST");
        const headers = (init?.headers || {}) as any;
        assert.equal(headers["Content-Type"], "application/json");
        assert.equal(init?.body, JSON.stringify(bodies[i]));
      }
    }
  )
);

// 3: custom headers override default content-type

test(
  "postJSON allows overriding Content-Type header",
  withRecordingFetch([{ body: { ok: true }, contentType: "application/json" }], async records => {
    await postJSON(
      "https://example.com/custom-header",
      { a: 1 },
      { headers: { "Content-Type": "application/vnd.custom+json" } }
    );

    const [req] = records;
    const headers = (req.init?.headers || {}) as any;
    assert.equal(headers["Content-Type"], "application/vnd.custom+json");
  })
);

// 4: timeout propagates from getJSON

test(
  "postJSON respects timeoutMs option",
  withRecordingFetch(
    [
      // fetch promise never resolves; timeout wrapper should reject
      { status: 200, body: { ok: true } },
    ],
    async () => {
      const originalFetch = (globalThis as any).fetch;
      (globalThis as any).fetch = () => new Promise(() => {}) as any;

      try {
        await assert.rejects(
          postJSON("https://example.com/slow-post", { a: 1 }, { timeoutMs: 10 }),
          /timed out/
        );
      } finally {
        (globalThis as any).fetch = originalFetch;
      }
    }
  )
);
