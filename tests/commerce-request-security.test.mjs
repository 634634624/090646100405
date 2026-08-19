import assert from "node:assert/strict";
import test from "node:test";
import {
    canonicalCatalogRequest,
    commerceRequestAllowed,
    readBoundedText,
} from "../src/integrations/commerce/request-security.ts";

test("streams request bodies through the real byte limit", async () => {
    const accepted = new Request("https://example.test/api/commerce/shopify", {
        method: "POST",
        headers: { "content-length": "4" },
        body: "test",
    });
    assert.equal(await readBoundedText(accepted, 4), "test");

    const oversized = new Request("https://example.test/api/commerce/shopify", {
        method: "POST",
        body: new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(4_097));
                controller.close();
            },
        }),
        duplex: "half",
    });
    await assert.rejects(() => readBoundedText(oversized, 4_096), RangeError);
});

test("rejects malformed and forged declared lengths before parsing", async () => {
    const malformed = new Request("https://example.test/api/commerce/shopify", {
        method: "POST",
        headers: { "content-length": "invalid" },
        body: "{}",
    });
    await assert.rejects(() => readBoundedText(malformed, 4_096), RangeError);

    const tooLarge = new Request("https://example.test/api/commerce/shopify", {
        method: "POST",
        headers: { "content-length": "4097" },
        body: "{}",
    });
    await assert.rejects(() => readBoundedText(tooLarge, 4_096), RangeError);
});

test("canonicalizes catalog cache keys and routes requests through the coordinator", async () => {
    const request = new Request("https://example.test/api/commerce/shopify?cache-bust=1#ignored", {
        headers: {
            "cf-connecting-ip": "192.0.2.1",
            "user-agent": "qa",
        },
    });
    assert.equal(canonicalCatalogRequest(request).url, "https://example.test/api/commerce/shopify");

    const calls = [];
    const namespace = {
        getByName(name) {
            return {
                async allow(scope, limit, periodMs) {
                    calls.push({ name, scope, limit, periodMs });
                    return true;
                },
            };
        },
    };
    assert.equal(await commerceRequestAllowed(namespace, request, "checkout", 12), true);
    assert.equal(calls.length, 1);
    assert.match(calls[0].name, /^rate:[a-f0-9]{64}$/);
    assert.deepEqual({ ...calls[0], name: "redacted" }, {
        name: "redacted",
        scope: "checkout",
        limit: 12,
        periodMs: 60_000,
    });
    assert.equal(await commerceRequestAllowed(undefined, request, "checkout", 12), false);
});
