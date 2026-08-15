export type SupplierId = "webshippy" | "dressa" | "dropshippingxl";

export interface SupplierProductRecord {
    externalId: string;
    sku: string;
    title: string;
    description: string;
    category: string;
    priceHuf: number;
    stock: number;
    imageUrls: string[];
    updatedAt: string;
}

export interface SupplierAdapter {
    id: SupplierId;
    active: boolean;
    importProducts(input: unknown): Promise<SupplierProductRecord[]>;
    submitOrder?(input: unknown): Promise<{ externalOrderId: string }>;
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
        return {
            externalId: String(item.externalId),
            sku: String(item.sku),
            title: String(item.title),
            description: String(item.description ?? ""),
            category: String(item.category ?? "Egyéb"),
            priceHuf,
            stock,
            imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.map(String) : [],
            updatedAt: String(item.updatedAt ?? new Date(0).toISOString()),
        };
    });
}
