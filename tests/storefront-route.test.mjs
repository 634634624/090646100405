import assert from "node:assert/strict";
import test from "node:test";
import { ALL, POST } from "../src/pages/api/storefront.ts";

test("exposes the storefront handler as an Astro POST route", async (t) => {
    const originalFetch = globalThis.fetch;
    const originalEnvironment = { ...process.env };
    t.after(() => {
        globalThis.fetch = originalFetch;
        process.env = originalEnvironment;
    });

    process.env.SHOPIFY_STORE_DOMAIN = "demo.myshopify.com";
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "test-token";
    process.env.SHOPIFY_API_VERSION = "2026-07";
    globalThis.fetch = async () =>
        Response.json({ data: { products: { nodes: [], pageInfo: { hasNextPage: false } } } });

    const response = await POST({
        request: new Request("https://example.test/api/storefront", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                operation: "products",
                variables: {
                    first: 24,
                    after: null,
                    query: null,
                    sortKey: "BEST_SELLING",
                    reverse: false,
                },
            }),
        }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        data: { products: { nodes: [], pageInfo: { hasNextPage: false } } },
    });
});

test("rejects non-POST requests", async () => {
    const response = await ALL();
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
});
