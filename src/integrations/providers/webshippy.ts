import { assertSupplierRecords, type SupplierAdapter } from "./contracts";

export const webshippyAdapter: SupplierAdapter = {
    id: "webshippy",
    active: Boolean(import.meta.env.WEBSHIPPY_API_URL && import.meta.env.WEBSHIPPY_API_KEY),
    async importProducts(input) {
        return assertSupplierRecords(input);
    },
    async submitOrder() {
        if (!this.active) throw new Error("A rendelési kapcsolat nincs beállítva.");
        throw new Error("A Webshippy rendelési végpont szerződéses jóváhagyásra vár.");
    },
};
