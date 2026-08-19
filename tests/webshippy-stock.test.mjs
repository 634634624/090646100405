import assert from "node:assert/strict";
import test from "node:test";
import { MOCK_PRODUCTS } from "../src/data/demo-catalog.ts";
import { DEMO_VARIANT_IDS } from "../src/integrations/commerce/shopify-ucp.ts";
import {
    applyWebshippyStock,
    assertWebshippyStock,
    fetchWebshippyStock,
    parseWebshippyStockCsv,
} from "../src/integrations/commerce/webshippy-stock.ts";

const CSV = '"sku","quantity","available_quantity","reserved_by_orders"\n' +
    '"DEMO-TECH-001",0,9,1\n' +
    '"DEMO-TECH-002",0,3,7\n' +
    '"DEMO-TECH-003",0,0,10';

test("parses Webshippy available stock and rejects malformed rows", () => {
    assert.deepEqual(parseWebshippyStockCsv(CSV), [
        { sku: "DEMO-TECH-001", availableQuantity: 9 },
        { sku: "DEMO-TECH-002", availableQuantity: 3 },
        { sku: "DEMO-TECH-003", availableQuantity: 0 },
    ]);
    assert.throws(() => parseWebshippyStockCsv('"sku"\n"DEMO-TECH-001"'), /Hibás/);
    assert.throws(() => parseWebshippyStockCsv('"sku","available_quantity"\n"DEMO-TECH-001",-1'), /Hibás/);
});

test("merges Webshippy quantities while Shopify availability remains a hard gate", () => {
    const shopifyProducts = MOCK_PRODUCTS.map((product, index) => ({
        ...product,
        variants: [{ ...product.variants[0], availableForSale: index !== 0 }],
    }));
    const products = applyWebshippyStock(shopifyProducts, parseWebshippyStockCsv(CSV));
    assert.equal(products[0].inventoryState, "sold-out");
    assert.equal(products[0].variants[0].quantityAvailable, 0);
    assert.equal(products[1].inventoryState, "low-stock");
    assert.equal(products[1].variants[0].quantityAvailable, 3);
    assert.equal(products[2].inventoryState, "sold-out");
    assert.throws(() => applyWebshippyStock(shopifyProducts, []), /Hiányzó/);
});

test("blocks checkout quantities that Webshippy cannot fulfil", () => {
    const stock = parseWebshippyStockCsv(CSV);
    assert.doesNotThrow(() => assertWebshippyStock([
        { variantId: DEMO_VARIANT_IDS[0], quantity: 9 },
        { variantId: DEMO_VARIANT_IDS[1], quantity: 3 },
    ], stock));
    assert.throws(() => assertWebshippyStock([
        { variantId: DEMO_VARIANT_IDS[1], quantity: 4 },
    ], stock), /nincs Webshippy-készleten/);
    assert.throws(() => assertWebshippyStock([
        { variantId: DEMO_VARIANT_IDS[2], quantity: 1 },
    ], stock), /nincs Webshippy-készleten/);
    assert.throws(() => assertWebshippyStock([
        { variantId: "gid://shopify/ProductVariant/unknown", quantity: 1 },
    ], stock), /nincs Webshippy-készleten/);
});

test("fetches stock server-side without exposing the API key in the URL", async () => {
    let captured;
    const stock = await fetchWebshippyStock("private-key", async (url, options) => {
        captured = { url: String(url), request: JSON.parse(options.body.get("request")) };
        return new Response(CSV, { status: 200 });
    });
    assert.equal(captured.url, "https://app.webshippy.com/wspyapi/getStockInfoCsv/json/");
    assert.equal(captured.url.includes("private-key"), false);
    assert.equal(captured.request.apiKey, "private-key");
    assert.equal(stock.length, 3);
});

test("rejects missing credentials, provider errors, and malformed stock", async () => {
    let calls = 0;
    await assert.rejects(
        fetchWebshippyStock("", async () => {
            calls += 1;
            return new Response(CSV);
        }),
        /Hiányzó/,
    );
    assert.equal(calls, 0);
    await assert.rejects(
        fetchWebshippyStock("private-key", async () => new Response("unavailable", { status: 503 })),
        /HTTP 503/,
    );
    await assert.rejects(
        fetchWebshippyStock("private-key", async () => new Response('"sku"\n"DEMO-TECH-001"')),
        /Hibás/,
    );
    await assert.rejects(
        fetchWebshippyStock("private-key", async () => {
            throw new DOMException("Timed out", "AbortError");
        }),
        { name: "AbortError" },
    );
});
