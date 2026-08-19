import assert from "node:assert/strict";
import test from "node:test";
import {
    buildWebshippyTestOrderFromShopify,
    handleShopifyPaidWebhook,
    safeWebshippyResult,
    validateShopifyWebhookHeaders,
    verifyShopifyWebhook,
} from "../src/integrations/commerce/shopify-paid-webhook.ts";

const bridgeEnv = {
    SHOPIFY_WEBHOOK_SECRET: "secret",
    WEBSHIPPY_API_KEY: "private-api-key",
    WEBSHIPPY_WRITE_MODE: "test",
};

async function signedRequest(body, overrides = {}) {
    const raw = typeof body === "string" ? body : JSON.stringify(body);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw))).toString("base64");
    return new Request("https://example.test/api/commerce/shopify-orders-paid", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-shopify-hmac-sha256": signature,
            "x-shopify-topic": "orders/paid",
            "x-shopify-shop-domain": "devshop-vmthv4tq.myshopify.com",
            "x-shopify-webhook-id": "delivery-1",
            ...overrides,
        },
        body: raw,
    });
}

const payload = {
    id: 6123456789012,
    name: "#1008",
    test: true,
    created_at: "2026-08-19T05:00:00+02:00",
    email: "qa@example.com",
    current_total_discounts: "0.00",
    current_total_shipping_price_set: { shop_money: { amount: "2500.00" } },
    shipping_address: {
        name: "Teszt Vásárló",
        phone: "+3610000000",
        country_code: "HU",
        zip: "1061",
        city: "Budapest",
        address1: "Andrássy út 1.",
    },
    line_items: [{ sku: "DEMO-TECH-003", quantity: 2, variant_title: "Alapváltozat", price: "1.00" }],
};

test("verifies Shopify HMAC over the unchanged raw body", async () => {
    const raw = JSON.stringify(payload);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
    const signature = Buffer.from(bytes).toString("base64");
    assert.equal(await verifyShopifyWebhook(raw, signature, "secret"), true);
    assert.equal(await verifyShopifyWebhook(`${raw} `, signature, "secret"), false);
});

test("requires the paid topic, exact store, and delivery id", () => {
    const headers = new Headers({
        "x-shopify-topic": "orders/paid",
        "x-shopify-shop-domain": "devshop-vmthv4tq.myshopify.com",
        "x-shopify-webhook-id": "delivery-1",
    });
    assert.deepEqual(validateShopifyWebhookHeaders(headers), { webhookId: "delivery-1" });
    headers.set("x-shopify-topic", "orders/create");
    assert.throws(() => validateShopifyWebhookHeaders(headers), /topic/);
});

test("maps only trusted demo SKUs and server-owned prices", () => {
    const order = buildWebshippyTestOrderFromShopify(payload);
    assert.equal(order.referenceId, "shopify-6123456789012");
    assert.equal(order.shipping.mode, "GLS-HU");
    assert.match(order.shipping.note, /TILOS TELJESÍTENI/);
    assert.equal(order.payment.paymentStatus, "pending");
    assert.equal(order.products[0].priceGross, 18_990);
    assert.equal(order.products[0].quantity, 2);
});

test("skips live orders and rejects unsupported test data", () => {
    assert.equal(buildWebshippyTestOrderFromShopify({ ...payload, test: false }), null);
    assert.throws(() => buildWebshippyTestOrderFromShopify({ ...payload, line_items: [{ sku: "REAL-1", quantity: 1 }] }), /unsupported product/);
    assert.throws(() => buildWebshippyTestOrderFromShopify({ ...payload, shipping_address: { ...payload.shipping_address, country_code: "US" } }), /delivery address/);
});

test("accepts only successful numeric Webshippy IDs", () => {
    assert.deepEqual(safeWebshippyResult({ status: "success", wspyId: 43530042 }), { wspyId: "43530042" });
    assert.throws(() => safeWebshippyResult({ status: "error", message: "private" }), /rejected/);
    assert.throws(() => safeWebshippyResult({ status: "success", wspyId: "bad" }), /order ID/);
});

test("submits a valid signed test order without exposing credentials", async () => {
    let submitted;
    const response = await handleShopifyPaidWebhook(await signedRequest(payload), bridgeEnv, async (_url, init) => {
        submitted = new URLSearchParams(init.body).get("request");
        return Response.json({ status: "success", wspyId: 43530099 });
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        accepted: true,
        webhookId: "delivery-1",
        referenceId: "shopify-6123456789012",
        wspyId: "43530099",
    });
    assert.match(submitted, /private-api-key/);
});

test("rejects forged and oversized requests before calling Webshippy", async () => {
    let calls = 0;
    const provider = async () => {
        calls += 1;
        return Response.json({ status: "success", wspyId: 1 });
    };
    const forged = await signedRequest(payload, { "x-shopify-hmac-sha256": "forged" });
    assert.equal((await handleShopifyPaidWebhook(forged, bridgeEnv, provider)).status, 401);
    const oversized = await signedRequest(payload, { "content-length": String(256 * 1024 + 1) });
    assert.equal((await handleShopifyPaidWebhook(oversized, bridgeEnv, provider)).status, 413);
    assert.equal(calls, 0);
});

test("acknowledges permanent payload errors but retries transient Webshippy errors", async () => {
    const unsupported = await signedRequest({ ...payload, line_items: [{ sku: "REAL-1", quantity: 1 }] });
    const skipped = await handleShopifyPaidWebhook(unsupported, bridgeEnv);
    assert.equal(skipped.status, 200);
    assert.match((await skipped.json()).skipped, /unsupported product/);

    const unavailable = await handleShopifyPaidWebhook(await signedRequest(payload), bridgeEnv, async () => {
        throw new Error("timeout");
    });
    assert.equal(unavailable.status, 503);
});
