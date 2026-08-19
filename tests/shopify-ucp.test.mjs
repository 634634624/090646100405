import assert from "node:assert/strict";
import test from "node:test";
import { MOCK_PRODUCTS } from "../src/data/demo-catalog.ts";
import {
    applyShopifyCatalog,
    catalogRequest,
    checkoutRequest,
    checkoutUrlFromResponse,
    DEMO_VARIANT_IDS,
    validateCheckoutLines,
} from "../src/integrations/commerce/shopify-ucp.ts";

test("allows only the three demo variants with bounded quantities", () => {
    const lines = validateCheckoutLines([{ variantId: DEMO_VARIANT_IDS[0], quantity: 2 }]);
    assert.deepEqual(lines, [{ variantId: DEMO_VARIANT_IDS[0], quantity: 2 }]);
    assert.throws(() => validateCheckoutLines([{ variantId: "gid://shopify/ProductVariant/999", quantity: 1 }]), /Nem engedélyezett/);
    assert.throws(() => validateCheckoutLines([{ variantId: DEMO_VARIANT_IDS[0], quantity: 11 }]), /1 és 10/);
    assert.throws(() => validateCheckoutLines([
        { variantId: DEMO_VARIANT_IDS[0], quantity: 1 },
        { variantId: DEMO_VARIANT_IDS[0], quantity: 1 },
    ]), /ismétlődő/);
});

test("builds current capability-specific UCP requests without secrets", () => {
    const catalog = catalogRequest();
    const checkout = checkoutRequest([{ variantId: DEMO_VARIANT_IDS[1], quantity: 3 }]);
    assert.equal(checkout.params.name, "create_cart");
    assert.deepEqual(checkout.params.arguments.cart.line_items, [{ quantity: 3, item: { id: DEMO_VARIANT_IDS[1] } }]);
    assert.equal(checkout.params.arguments.cart.context.address_country, "HU");
    assert.equal(JSON.stringify(checkout).includes("token"), false);
    assert.match(catalog.params.arguments.meta["ucp-agent"].profile, /valid-with-capabilities/);
    assert.match(checkout.params.arguments.meta["ucp-agent"].profile, /cart-and-checkout/);
});

test("maps Shopify minor-unit prices and availability onto the checked seed", () => {
    const payload = {
        result: { structuredContent: { products: MOCK_PRODUCTS.map((product, index) => ({
            variants: [{
                id: product.variants[0].id,
                price: { amount: [8999000, 11999000, 1899000][index], currency: "HUF" },
                availability: { available: index !== 1 },
            }],
        })) } },
    };
    const products = applyShopifyCatalog(MOCK_PRODUCTS, payload);
    assert.equal(products[0].variants[0].price.amount, "89990");
    assert.equal(products[1].inventoryState, "sold-out");
    assert.equal(products[2].variants[0].availableForSale, true);
});

test("accepts only the exact Shopify cart host and rejects sold-out outcomes", () => {
    const valid = { result: { structuredContent: {
        line_items: [{ id: "line-1", item: { id: DEMO_VARIANT_IDS[0] }, quantity: 1 }],
        messages: [],
        continue_url: "https://devshop-vmthv4tq.myshopify.com/cart/c/test?key=ok",
    } } };
    assert.match(checkoutUrlFromResponse(valid, [{ variantId: DEMO_VARIANT_IDS[0], quantity: 1 }]), /^https:\/\/devshop-vmthv4tq\.myshopify\.com\/cart\//);
    assert.throws(() => checkoutUrlFromResponse({ result: { structuredContent: {
        line_items: [],
        messages: [{ type: "warning", code: "merchandise_out_of_stock", content: "Sold out" }],
    } } }), /Sold out/);
    assert.throws(() => checkoutUrlFromResponse({ result: { structuredContent: {
        line_items: [{ id: "line-1", item: { id: DEMO_VARIANT_IDS[0] }, quantity: 1 }],
        messages: [{ type: "warning", code: "merchandise_not_enough_stock", content: "Only 1 item was added." }],
        continue_url: "https://devshop-vmthv4tq.myshopify.com/cart/c/test?key=ok",
    } } }, [{ variantId: DEMO_VARIANT_IDS[0], quantity: 10 }]), /Only 1 item/);
    assert.throws(() => checkoutUrlFromResponse({ result: { structuredContent: {
        line_items: [{ id: "line-1", item: { id: DEMO_VARIANT_IDS[0] }, quantity: 1 }],
        messages: [],
        continue_url: "https://devshop-vmthv4tq.myshopify.com/cart/c/test?key=ok",
    } } }, [{ variantId: DEMO_VARIANT_IDS[0], quantity: 2 }]), /nincs készleten/);
    assert.throws(() => checkoutUrlFromResponse({ result: { structuredContent: {
        line_items: [{}],
        messages: [],
        continue_url: "https://evil.example/cart/c/test",
    } } }), /érvénytelen/);
});
