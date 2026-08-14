import assert from "node:assert/strict";
import test from "node:test";
import { createShopifyCheckout, ShopifyError } from "../src/integrations/commerce/shopify.ts";

const config = { domain: "demo.myshopify.com", token: "storefront-secret", apiVersion: "2026-07" };

test("creates a hosted Shopify checkout with server-side token", async () => {
    let request;
    const fetcher = async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({ data: { cartCreate: { cart: { id: "gid://shopify/Cart/1", checkoutUrl: "https://demo.myshopify.com/checkouts/1" }, userErrors: [] } } }), { status: 200 });
    };
    const result = await createShopifyCheckout(config, [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 }], fetcher);
    assert.equal(result.checkoutUrl, "https://demo.myshopify.com/checkouts/1");
    assert.equal(request.options.headers["X-Shopify-Storefront-Access-Token"], "storefront-secret");
    assert.equal(request.url, "https://demo.myshopify.com/api/2026-07/graphql.json");
});

test("rejects invalid cart lines before network", async () => {
    let called = false;
    await assert.rejects(createShopifyCheckout(config, [{ merchandiseId: "bad", quantity: 0 }], async () => { called = true; }), ShopifyError);
    assert.equal(called, false);
});

test("rejects provider and unsafe checkout responses", async () => {
    await assert.rejects(createShopifyCheckout(config, [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }], async () => new Response(JSON.stringify({ data: { cartCreate: { cart: null, userErrors: [{ message: "sold out" }] } } }), { status: 200 })), /sold out/);
    await assert.rejects(createShopifyCheckout(config, [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }], async () => new Response(JSON.stringify({ data: { cartCreate: { cart: { id: "1", checkoutUrl: "http://unsafe.test" }, userErrors: [] } } }), { status: 200 })), /unsafe/);
});
