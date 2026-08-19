import assert from "node:assert/strict";
import test from "node:test";
import { MOCK_PRODUCTS } from "../src/data/demo-catalog.ts";
import {
    quantityForVariant,
    reconcileCartLinesWithCatalog,
    sellableQuantity,
} from "../src/integrations/commerce/cart-inventory.ts";

const first = MOCK_PRODUCTS[0];
const firstVariant = first.variants[0];
const line = {
    id: "line-1",
    merchandiseId: firstVariant.id,
    productHandle: "stale",
    productTitle: "Stale",
    variantTitle: "Stale",
    quantity: 99,
    unitPrice: { amount: "1", currencyCode: "HUF" },
    lineTotal: { amount: "99", currencyCode: "HUF" },
};

test("derives safe sellable quantities", () => {
    assert.equal(sellableQuantity(firstVariant), 4);
    assert.equal(sellableQuantity({ ...firstVariant, quantityAvailable: undefined }), 1);
    assert.equal(sellableQuantity({ ...firstVariant, availableForSale: false }), 0);
    assert.equal(quantityForVariant(MOCK_PRODUCTS, firstVariant.id), 4);
    assert.equal(quantityForVariant(MOCK_PRODUCTS, "missing"), 0);
});

test("reconciles stale cart lines to the live catalog and stock ceiling", () => {
    const reconciled = reconcileCartLinesWithCatalog([line], MOCK_PRODUCTS);
    assert.equal(reconciled.length, 1);
    assert.equal(reconciled[0].quantity, 4);
    assert.equal(reconciled[0].productTitle, first.title);
    assert.deepEqual(reconciled[0].unitPrice, firstVariant.price);
    assert.deepEqual(reconcileCartLinesWithCatalog([{ ...line, merchandiseId: "missing" }], MOCK_PRODUCTS), []);
});

test("quantity reconciliation is bounded for a broad input range", () => {
    for (let quantity = -50; quantity <= 100; quantity += 1) {
        const [reconciled] = reconcileCartLinesWithCatalog([{ ...line, quantity }], MOCK_PRODUCTS);
        assert.equal(reconciled.quantity >= 1 && reconciled.quantity <= 4, true);
    }
});
