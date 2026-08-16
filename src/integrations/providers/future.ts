import { assertSupplierRecords, type SupplierAdapter } from "./contracts";

export const dressaAdapter: SupplierAdapter = {
    id: "dressa",
    active: false,
    async importProducts(input) { return assertSupplierRecords(input); },
};

export const dropshippingXlAdapter: SupplierAdapter = {
    id: "dropshippingxl",
    active: false,
    async importProducts(input) { return assertSupplierRecords(input); },
};
