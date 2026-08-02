import assert from "node:assert/strict";
import test from "node:test";
import { assertSupplierOrderDraft, assertSupplierRecords } from "../src/integrations/providers/contracts.ts";

test("accepts a valid Webshippy-ready product record", () => {
    const [product] = assertSupplierRecords([{
        externalId: "ws-1",
        sku: "DEMO-TECH-001",
        title: "Otthoni zene alapcsomag",
        priceHuf: 89990,
        stock: 8,
    }]);
    assert.equal(product.priceHuf, 89990);
    assert.equal(product.updatedAt, "1970-01-01T00:00:00.000Z");
});

test("rejects unsafe product price and stock values", () => {
    for (const record of [
        { externalId: "ws-1", sku: "SKU", title: "Termék", priceHuf: -1, stock: 1 },
        { externalId: "ws-1", sku: "SKU", title: "Termék", priceHuf: 1, stock: 1.5 },
    ]) {
        assert.throws(() => assertSupplierRecords([record]), /Hiányos beszállítói termékrekord/);
    }
});

test("accepts a Hungarian HUF order draft", () => {
    const order = assertSupplierOrderDraft({
        externalOrderId: "preview-1001",
        currency: "HUF",
        customer: { name: "Teszt Vásárló", email: "teszt@example.test" },
        delivery: { country: "HU", postalCode: "1011", city: "Budapest", addressLine: "Minta utca 1." },
        lines: [{ sku: "DEMO-TECH-001", quantity: 2, unitPriceHuf: 89990 }],
    });
    assert.equal(order.lines[0].quantity, 2);
    assert.equal(order.currency, "HUF");
});

test("rejects incomplete or non-HUF order drafts", () => {
    for (const order of [
        {},
        { externalOrderId: "preview-1001", currency: "EUR", customer: {}, delivery: {}, lines: [] },
    ]) {
        assert.throws(() => assertSupplierOrderDraft(order), /A rendelési adat hiányos/);
    }
});
