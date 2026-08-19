import type { Product } from "@/toolkit/commerce-shopify/lib/contracts";
import type { CheckoutLineInput } from "./shopify-ucp.ts";

export interface WebshippyStockRecord {
    sku: string;
    availableQuantity: number;
}

const SKU_BY_VARIANT_ID: Record<string, string> = {
    "gid://shopify/ProductVariant/50016701087882": "DEMO-TECH-001",
    "gid://shopify/ProductVariant/50016706265226": "DEMO-TECH-002",
    "gid://shopify/ProductVariant/50016709574794": "DEMO-TECH-003",
};

function parseCsvLine(line: string) {
    const fields: string[] = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                field += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === "," && !quoted) {
            fields.push(field);
            field = "";
        } else {
            field += character;
        }
    }
    if (quoted) throw new Error("Hibás Webshippy készletadat.");
    fields.push(field);
    return fields;
}

export function parseWebshippyStockCsv(csv: string): WebshippyStockRecord[] {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("Üres Webshippy készletadat.");
    const header = parseCsvLine(lines[0]);
    const skuIndex = header.indexOf("sku");
    const quantityIndex = header.indexOf("available_quantity");
    if (skuIndex < 0 || quantityIndex < 0) throw new Error("Hibás Webshippy készletadat.");

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const sku = values[skuIndex]?.trim() ?? "";
        const availableQuantity = Number(values[quantityIndex]);
        if (!sku || !Number.isSafeInteger(availableQuantity) || availableQuantity < 0) {
            throw new Error("Hibás Webshippy készletadat.");
        }
        return { sku, availableQuantity };
    });
}

export async function fetchWebshippyStock(
    apiKey: string,
    fetchProvider: typeof fetch = fetch,
    baseUrl = "https://app.webshippy.com/wspyapi",
) {
    if (!apiKey.trim()) throw new Error("Hiányzó Webshippy API kulcs.");
    const body = new URLSearchParams({ request: JSON.stringify({ apiKey }) });
    const response = await fetchProvider(`${baseUrl.replace(/\/$/, "")}/getStockInfoCsv/json/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
        signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Webshippy HTTP ${response.status}`);
    return parseWebshippyStockCsv(await response.text());
}

export function applyWebshippyStock(products: Product[], stock: WebshippyStockRecord[]): Product[] {
    const quantityBySku = new Map(stock.map((record) => [record.sku, record.availableQuantity]));
    return products.map((product) => {
        const variant = product.variants[0];
        const sku = SKU_BY_VARIANT_ID[variant.id];
        const quantity = sku === undefined ? undefined : quantityBySku.get(sku);
        if (quantity === undefined) throw new Error("Hiányzó Webshippy demókészlet.");
        const availableForSale = variant.availableForSale && quantity > 0;
        return {
            ...product,
            variants: [{ ...variant, availableForSale, quantityAvailable: availableForSale ? quantity : 0 }],
            inventoryState: !availableForSale ? "sold-out" : quantity <= 3 ? "low-stock" : "available",
        } satisfies Product;
    });
}

export function assertWebshippyStock(lines: CheckoutLineInput[], stock: WebshippyStockRecord[]) {
    const quantityBySku = new Map(stock.map((record) => [record.sku, record.availableQuantity]));
    for (const line of lines) {
        const sku = SKU_BY_VARIANT_ID[line.variantId];
        const available = sku === undefined ? undefined : quantityBySku.get(sku);
        if (available === undefined || line.quantity > available) {
            throw new Error("A kért mennyiség nincs Webshippy-készleten.");
        }
    }
}
