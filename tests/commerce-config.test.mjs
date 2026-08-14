import assert from "node:assert/strict";
import test from "node:test";
import { commerceConfig, publicCommerceStatus } from "../src/integrations/commerce/config.ts";

test("defaults to side-effect-free mock mode", () => {
    assert.deepEqual(publicCommerceStatus(commerceConfig({})), { mode: "mock", shopifyConfigured: false, webshippyConfigured: false, webshippyOrderOwner: "shopify-connector", liveWritesEnabled: false });
});

test("parses provider settings without exposing secrets", () => {
    const config = commerceConfig({ COMMERCE_MODE: "live", SHOPIFY_STORE_DOMAIN: "https://demo.myshopify.com/", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "secret", SHOPIFY_VARIANT_MAP_JSON: '{"SKU-1":"gid://shopify/ProductVariant/1"}', WEBSHIPPY_API_KEY: "ws-secret" });
    assert.equal(config.shopify?.domain, "demo.myshopify.com");
    assert.equal(config.shopify?.variantBySku["SKU-1"], "gid://shopify/ProductVariant/1");
    assert.equal(JSON.stringify(publicCommerceStatus(config)).includes("secret"), false);
});

test("rejects malformed JSON maps", () => {
    assert.throws(() => commerceConfig({ SHOPIFY_STORE_DOMAIN: "demo.myshopify.com", SHOPIFY_VARIANT_MAP_JSON: "{" }), /valid JSON/);
});

test("configures tokenless Shopify from the store domain alone", () => {
    const config = commerceConfig({ COMMERCE_MODE: "live", SHOPIFY_STORE_DOMAIN: "demo.myshopify.com" });
    assert.equal(config.shopify?.domain, "demo.myshopify.com");
    assert.equal(config.shopify?.token, undefined);
});
