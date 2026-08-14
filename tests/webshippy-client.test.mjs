import assert from "node:assert/strict";
import test from "node:test";
import { createWebshippyOrder, getWebshippyProducts, getWebshippyTracking, upsertWebshippyProduct, WebshippyError } from "../src/integrations/commerce/webshippy.ts";

const config = { baseUrl: "https://app.webshippy.com/wspyapi", apiKey: "ws-secret" };

test("wraps Webshippy JSON inside the required request form field", async () => {
    let request;
    await getWebshippyProducts(config, { sku: "SKU-1" }, async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({ status: "success", result: [] }), { status: 200 });
    });
    const payload = JSON.parse(request.options.body.get("request"));
    assert.equal(request.url, "https://app.webshippy.com/wspyapi/GetProduct/json");
    assert.equal(payload.apiKey, "ws-secret");
    assert.equal(payload.filters.sku, "SKU-1");
    assert.equal(request.url.includes("ws-secret"), false);
});

test("maps a trusted product to Webshippy CreateProduct", async () => {
    let payload;
    await upsertWebshippyProduct(config, { externalId: "p-1", sku: "SKU-1", title: "Test", description: "Copy", category: "Test", priceHuf: 12700, stock: 1, imageUrls: ["https://img.test/1", "https://img.test/2"], updatedAt: new Date(0).toISOString() }, "BAR-1", async (_url, options) => {
        payload = JSON.parse(options.body.get("request"));
        return new Response(JSON.stringify({ status: "success" }), { status: 200 });
    });
    assert.equal(payload.product.price, 10000);
    assert.equal(payload.product.vat, 0.27);
    assert.equal(payload.product.imageUrls, "https://img.test/1;https://img.test/2");
});

test("rejects missing barcode and provider errors", async () => {
    const product = { externalId: "p-1", sku: "SKU-1", title: "Test", description: "", category: "", priceHuf: 100, stock: 1, imageUrls: [], updatedAt: new Date(0).toISOString() };
    assert.throws(() => upsertWebshippyProduct(config, product, ""), WebshippyError);
    await assert.rejects(getWebshippyProducts(config, {}, async () => new Response(JSON.stringify({ status: "error", message: ["bad key"] }), { status: 200 })), /bad key/);
});

test("uses Webshippy numeric order IDs for tracking", async () => {
    let requestedUrl;
    await getWebshippyTracking(config, "32042911", async (url) => {
        requestedUrl = String(url);
        return new Response(JSON.stringify({ status: "success", result: {} }), { status: 200 });
    });
    const url = new URL(requestedUrl);
    assert.equal(url.pathname, "/wspyapi/getTrackInfo/json");
    assert.equal(url.searchParams.get("orderIds"), "32042911");
    await assert.rejects(getWebshippyTracking(config, "reference-name", async () => new Response()), /Numeric/);
});

test("maps an approved paid order to official Webshippy field names", async () => {
    let payload;
    await createWebshippyOrder(config, {
        externalOrderId: "shopify-1001", currency: "HUF",
        customer: { name: "Test Buyer", email: "buyer@example.test", phone: "+361234567" },
        delivery: { country: "HU", postalCode: "1011", city: "Budapest", addressLine: "Minta utca 1." },
        lines: [{ sku: "SKU-1", quantity: 1, unitPriceHuf: 12700 }],
    }, async (_url, options) => {
        payload = JSON.parse(options.body.get("request"));
        return new Response(JSON.stringify({ status: "success" }), { status: 200 });
    });
    assert.deepEqual(payload.order.shipping, { name: "Test Buyer", email: "buyer@example.test", phone: "+361234567", countryCode: "HU", zip: "1011", city: "Budapest", address1: "Minta utca 1." });
    assert.equal(payload.order.payment.paymentMode, "card");
    assert.equal(payload.order.payment.paymentStatus, "paid");
});
