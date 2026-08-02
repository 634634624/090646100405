export type SupplierId = "webshippy" | "dressa" | "dropshippingxl";
export interface SupplierProductRecord {
    externalId: string; sku: string; title: string; description: string; category: string;
    priceHuf: number; stock: number; imageUrls: string[]; updatedAt: string;
}
export interface SupplierOrderDraft {
    externalOrderId: string;
    currency: "HUF";
    customer: { name: string; email: string; phone?: string };
    delivery: { country: "HU"; postalCode: string; city: string; addressLine: string };
    lines: { sku: string; quantity: number; unitPriceHuf: number }[];
}
export interface SupplierAdapter {
    id: SupplierId;
    configured: boolean;
    active: boolean;
    importProducts(input: unknown): Promise<SupplierProductRecord[]>;
    createOrderPayload(input: unknown): SupplierOrderDraft;
}
export function assertSupplierRecords(input: unknown): SupplierProductRecord[] {
    if (!Array.isArray(input)) throw new Error("A beszállítói terméklista nem tömb.");
    return input.map((row, index) => {
        if (!row || typeof row !== "object") throw new Error(`Hibás termékrekord: ${index + 1}.`);
        const item = row as Record<string, unknown>;
        const priceHuf = Number(item.priceHuf);
        const stock = Number(item.stock);
        if (!item.externalId || !item.sku || !item.title || !Number.isFinite(priceHuf) || priceHuf < 0 || !Number.isInteger(stock) || stock < 0) {
            throw new Error(`Hiányos beszállítói termékrekord: ${index + 1}.`);
        }
        return { externalId: String(item.externalId), sku: String(item.sku), title: String(item.title), description: String(item.description ?? ""), category: String(item.category ?? "Egyéb"), priceHuf, stock, imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.map(String) : [], updatedAt: String(item.updatedAt ?? new Date(0).toISOString()) };
    });
}

export function assertSupplierOrderDraft(input: unknown): SupplierOrderDraft {
    if (!input || typeof input !== "object") throw new Error("A rendelési adat nem objektum.");
    const order = input as Record<string, unknown>;
    const customer = order.customer as Record<string, unknown> | undefined;
    const delivery = order.delivery as Record<string, unknown> | undefined;
    if (!order.externalOrderId || order.currency !== "HUF" || !customer?.name || !customer.email || delivery?.country !== "HU" || !delivery.postalCode || !delivery.city || !delivery.addressLine) {
        throw new Error("A rendelési adat hiányos.");
    }
    if (!Array.isArray(order.lines) || order.lines.length === 0) throw new Error("A rendelésnek nincs tétele.");
    const lines = order.lines.map((line, index) => {
        if (!line || typeof line !== "object") throw new Error(`Hibás rendelési tétel: ${index + 1}.`);
        const item = line as Record<string, unknown>;
        const quantity = Number(item.quantity);
        const unitPriceHuf = Number(item.unitPriceHuf);
        if (!item.sku || !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPriceHuf) || unitPriceHuf < 0) {
            throw new Error(`Hiányos rendelési tétel: ${index + 1}.`);
        }
        return { sku: String(item.sku), quantity, unitPriceHuf };
    });
    return {
        externalOrderId: String(order.externalOrderId),
        currency: "HUF",
        customer: { name: String(customer.name), email: String(customer.email), ...(customer.phone ? { phone: String(customer.phone) } : {}) },
        delivery: { country: "HU", postalCode: String(delivery.postalCode), city: String(delivery.city), addressLine: String(delivery.addressLine) },
        lines,
    };
}
