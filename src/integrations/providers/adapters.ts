import { assertSupplierOrderDraft, assertSupplierRecords, type SupplierAdapter } from "./contracts";

const webshippyConfigured = Boolean(import.meta.env.WEBSHIPPY_API_URL && import.meta.env.WEBSHIPPY_API_KEY);
export const webshippyAdapter: SupplierAdapter = {
    id: "webshippy", configured: webshippyConfigured, active: webshippyConfigured && import.meta.env.COMMERCE_MODE === "live",
    async importProducts(input) { return assertSupplierRecords(input); },
    createOrderPayload(input) { return assertSupplierOrderDraft(input); },
};
export const dressaAdapter: SupplierAdapter = {
    id: "dressa", configured: false, active: false,
    async importProducts(input) { return assertSupplierRecords(input); },
    createOrderPayload(input) { return assertSupplierOrderDraft(input); },
};
export const dropshippingXlAdapter: SupplierAdapter = {
    id: "dropshippingxl", configured: false, active: false,
    async importProducts(input) { return assertSupplierRecords(input); },
    createOrderPayload(input) { return assertSupplierOrderDraft(input); },
};
