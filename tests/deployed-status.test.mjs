import assert from "node:assert/strict";
import test from "node:test";
import { DEPLOYED_COMMERCE_STATUS } from "../src/integrations/commerce/deployed-status.ts";

test("reports the deployed Shopify and Webshippy connector architecture", () => {
    assert.deepEqual(DEPLOYED_COMMERCE_STATUS, {
        mode: "live",
        shopifyConfigured: true,
        webshippyConfigured: true,
        webshippyOrderOwner: "shopify-connector",
        liveWritesEnabled: true,
        storefrontCatalog: "shopify-ucp",
        storefrontInventory: "webshippy-stock+shopify-availability",
        storefrontCheckout: "shopify-ucp",
        storefrontProducts: 3,
        storefrontCatalogCache: "cloudflare-workers-10s",
        storefrontProviderRetry: "bounded-transient-retry",
        storefrontMonitoring: "cloudflare-logs-traces",
        webshippyConnection: "shopify-connector",
        webshippyTestBridge: "shopify-orders-paid-webhook",
        webshippyCancellationBridge: "shopify-orders-cancelled-webhook",
        webshippyIdempotency: "durable-order-lock+reference-reconciliation",
    });
});
