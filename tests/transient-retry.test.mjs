import assert from "node:assert/strict";
import test from "node:test";
import {
    UpstreamHttpError,
    withTransientRetry,
} from "../src/integrations/commerce/transient-retry.ts";

test("retries transient provider failures with bounded exponential delays", async () => {
    let calls = 0;
    const delays = [];
    const result = await withTransientRetry(async () => {
        calls += 1;
        if (calls === 1) throw new UpstreamHttpError("Webshippy", 429);
        if (calls === 2) throw new TypeError("network unavailable");
        return "ok";
    }, {
        sleep: async (delayMs) => { delays.push(delayMs); },
    });

    assert.equal(result, "ok");
    assert.equal(calls, 3);
    assert.deepEqual(delays, [100, 200]);
});

test("does not retry permanent provider failures", async () => {
    let calls = 0;
    await assert.rejects(withTransientRetry(async () => {
        calls += 1;
        throw new UpstreamHttpError("Shopify", 400);
    }, { sleep: async () => {} }), /HTTP 400/);
    assert.equal(calls, 1);
});

test("stops after the configured retry budget", async () => {
    let calls = 0;
    await assert.rejects(withTransientRetry(async () => {
        calls += 1;
        throw new DOMException("Timed out", "TimeoutError");
    }, { attempts: 2, sleep: async () => {} }), { name: "TimeoutError" });
    assert.equal(calls, 2);
});

test("rejects unsafe retry settings", async () => {
    await assert.rejects(withTransientRetry(async () => "ok", { attempts: 0 }), RangeError);
    await assert.rejects(withTransientRetry(async () => "ok", { attempts: 6 }), RangeError);
    await assert.rejects(withTransientRetry(async () => "ok", { baseDelayMs: 2_001 }), RangeError);
});
